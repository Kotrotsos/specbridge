import { NextRequest, NextResponse } from "next/server";
import { generateResponse, generateSuggestions, extractKnowledge } from "@/lib/openai";
import { INTERVIEW_SYSTEM_PROMPT } from "@/config/prompts/interview";
import { SUGGESTIONS_SYSTEM_PROMPT, buildSuggestionsPrompt } from "@/config/prompts/suggestions";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt } from "@/config/prompts/extraction";
import { ArtifactType } from "@/lib/db";

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  initialDescription?: string;
  action?: "chat" | "suggestions" | "extract";
  artifactType?: ArtifactType;
  settings?: {
    diagramType?: "flowchart" | "sequence";
  };
}

// Artifact-specific extraction prompts
const ARTIFACT_PROMPTS: Record<ArtifactType, string> = {
  "overview": `Create a comprehensive process documentation from the interview. This should be a complete writeup that someone could use to understand the entire process.

Return JSON with:
{
  "overview": {
    "title": "process name",
    "summary": "A detailed 3-5 paragraph summary explaining what this process does, why it exists, who uses it, and its importance. Write this as proper prose, not bullet points.",
    "trigger": "what starts this process",
    "outcome": "final result when process completes successfully",
    "scope": "what is and isn't covered by this process"
  },
  "context": {
    "background": "Why this process exists, historical context if mentioned",
    "stakeholders": ["list of people/roles involved"],
    "frequency": "how often this process runs",
    "dependencies": ["systems or processes this depends on"]
  },
  "steps": [
    {
      "id": 1,
      "name": "step name",
      "description": "detailed description of what happens in this step",
      "actor": "who performs it",
      "effect": "how this changes state or moves the process forward",
      "inputs": ["data or materials needed"],
      "outputs": ["data or results produced"],
      "notes": "any special considerations or variations mentioned"
    }
  ],
  "edgeCases": [
    {
      "scenario": "edge case or exception",
      "handling": "how it should be handled"
    }
  ],
  "openQuestions": [
    {
      "question": "unresolved question from the interview",
      "impact": "why this matters"
    }
  ],
  "additionalNotes": "Any other important information discussed that doesn't fit above"
}

Write the summary as comprehensive prose that captures all the nuances discussed. Include all edge cases and open questions mentioned during the interview.`,
  "decision-tree": `Extract a decision tree from the interview. Return JSON with:
{
  "decisionTree": {
    "description": "brief description of the decision flow",
    "mermaid": "flowchart TD\\n    A[Start] --> B{Decision?}\\n    B -->|Yes| C[Action]\\n    B -->|No| D[Other]"
  }
}
IMPORTANT: The mermaid field must contain valid Mermaid flowchart syntax.
- Use flowchart TD for top-down layout
- Decision nodes MUST have matching braces: {Question?}
- Process nodes use [brackets]
- Use -->|label| for conditional edges`,
  "rules": `Extract business rules from the interview. Return JSON with:
{
  "rules": [
    {
      "id": "rule_1",
      "name": "short rule name",
      "condition": "the condition (without IF prefix)",
      "action": "the action to take (without THEN prefix)",
      "priority": 1,
      "exceptions": ["any exceptions"]
    }
  ]
}
Note: Do NOT include "IF" or "THEN" prefixes in the condition/action fields.`,
  "variables": `Extract variables and data from the interview. Return JSON with:
{
  "variables": [
    {
      "name": "variable name",
      "type": "number|text|boolean|date|list",
      "description": "what this represents",
      "possibleValues": ["if enumerable"],
      "constraints": "min/max/format"
    }
  ]
}`,
  "edge-cases": `Extract edge cases and exceptions from the interview. Return JSON with:
{
  "edgeCases": [
    {
      "scenario": "edge case description",
      "handling": "how to handle it"
    }
  ],
  "openQuestions": [
    {
      "question": "what needs clarification",
      "impact": "why it matters"
    }
  ]
}`
};

// Sequence diagram prompt (alternative to flowchart for decision-tree)
const SEQUENCE_DIAGRAM_PROMPT = `Extract a sequence diagram from the interview showing interactions between actors. Return JSON with:
{
  "decisionTree": {
    "description": "brief description of the interaction flow",
    "mermaid": "sequenceDiagram\\n    participant User\\n    participant System\\n    User->>System: Action\\n    System-->>User: Response"
  }
}
IMPORTANT: The mermaid field must contain valid Mermaid sequence diagram syntax.
- Start with "sequenceDiagram"
- Define participants: participant Name
- Solid arrow for requests: Actor->>Target: Message
- Dashed arrow for responses: Actor-->>Target: Message
- Use alt/else for conditional flows
- Use loop for repeated actions`;

/**
 * POST /api/chat
 *
 * Handles chat interactions with the interview AI
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, initialDescription, action = "chat" } = body;

    // Handle different actions
    switch (action) {
      case "suggestions": {
        // Generate answer suggestions for the last assistant message
        const lastAssistantMessage = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        if (!lastAssistantMessage) {
          return NextResponse.json({ suggestions: [] });
        }

        const context = messages
          .slice(-4)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");

        const suggestions = await generateSuggestions(
          buildSuggestionsPrompt(lastAssistantMessage.content, context),
          SUGGESTIONS_SYSTEM_PROMPT
        );

        return NextResponse.json({ suggestions });
      }

      case "extract": {
        // Extract knowledge from completed interview
        if (!initialDescription) {
          return NextResponse.json(
            { error: "Initial description required for extraction" },
            { status: 400 }
          );
        }

        const { artifactType, settings } = body;

        // Build the extraction prompt based on artifact type
        const transcript = messages
          .map((m) => `${m.role === "assistant" ? "BridgeSpec" : "Expert"}: ${m.content}`)
          .join("\n\n");

        let systemPrompt: string;
        let userPrompt: string;

        if (artifactType && ARTIFACT_PROMPTS[artifactType]) {
          systemPrompt = `You are a knowledge extraction system. Analyze interview transcripts and extract structured information.
Return ONLY valid JSON. No markdown code blocks, no explanations.`;

          // Use sequence diagram prompt if settings specify it
          let extractionPrompt = ARTIFACT_PROMPTS[artifactType];
          if (artifactType === "decision-tree" && settings?.diagramType === "sequence") {
            extractionPrompt = SEQUENCE_DIAGRAM_PROMPT;
          }

          userPrompt = `## Initial Description
${initialDescription}

## Interview Transcript
${transcript}

## Task
${extractionPrompt}`;
        } else {
          // Fall back to full extraction
          systemPrompt = EXTRACTION_SYSTEM_PROMPT;
          userPrompt = buildExtractionPrompt(initialDescription, messages);
        }

        console.log("[Extract] Starting extraction for:", artifactType || "full", initialDescription.slice(0, 50));

        const knowledge = await extractKnowledge(userPrompt, systemPrompt);
        console.log("[Extract] Result type:", typeof knowledge, "Has error:", !!(knowledge as Record<string, unknown>)?.error);

        return NextResponse.json({ knowledge });
      }

      case "chat":
      default: {
        // Convert messages to the format expected by the API
        const inputMessages: Array<{ role: "developer" | "user" | "assistant"; content: string }> = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Generate the next response
        const response = await generateResponse(inputMessages, INTERVIEW_SYSTEM_PROMPT);

        // Check if interview is complete
        const isComplete = response.includes("[INTERVIEW_COMPLETE]");
        const cleanedResponse = response.replace("[INTERVIEW_COMPLETE]", "").trim();

        return NextResponse.json({
          message: cleanedResponse,
          isComplete,
        });
      }
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
