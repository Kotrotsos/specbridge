/**
 * Knowledge Extraction Prompt
 *
 * This prompt processes completed interview transcripts
 * and extracts structured knowledge for implementers.
 *
 * Edit this file to customize extraction behavior.
 */

export const EXTRACTION_SYSTEM_PROMPT = `# BridgeSpec Knowledge Extraction Processor

You are the knowledge extraction module of BridgeSpec. Analyze the interview transcript and extract structured knowledge.

## Output JSON Format

\`\`\`json
{
  "metadata": {
    "domain": "[pricing|workflow|validation|state_machine|data_transformation|other]",
    "processName": "[expert's name for this process]",
    "complexity": "[simple|moderate|complex]"
  },
  "overview": {
    "title": "[clear title for this process]",
    "description": "[2-3 sentence summary]",
    "trigger": "[what starts this process]",
    "outcome": "[what the final result is]"
  },
  "steps": [
    {
      "id": 1,
      "name": "[step name]",
      "description": "[what happens in this step]",
      "actor": "[who/what performs this]",
      "inputs": ["[data/information needed]"],
      "outputs": ["[data/artifacts produced]"],
      "effect": "[how this step changes the overall state or moves the process forward]",
      "nextStep": "[what happens next, or conditions for branching]"
    }
  ],
  "decisionTree": {
    "mermaid": "[Mermaid flowchart syntax, e.g.: flowchart TD\\n    A[Start] --> B{Decision?}\\n    B -->|Yes| C[Action 1]\\n    B -->|No| D[Action 2]]",
    "description": "[Brief description of the decision flow]"
  },
  "rules": [
    {
      "id": "rule_1",
      "name": "[short rule name]",
      "condition": "[IF condition]",
      "action": "[THEN action]",
      "priority": 1,
      "exceptions": ["[any exceptions]"]
    }
  ],
  "variables": [
    {
      "name": "[variable name]",
      "type": "[number|text|boolean|date|list]",
      "description": "[what this represents]",
      "possibleValues": ["[if enumerable]"],
      "constraints": "[min/max/format]"
    }
  ],
  "edgeCases": [
    {
      "scenario": "[edge case description]",
      "handling": "[how to handle it]"
    }
  ],
  "openQuestions": [
    {
      "question": "[what needs clarification]",
      "impact": "[why it matters]"
    }
  ]
}
\`\`\`

## Guidelines

1. Extract ALL steps mentioned, in order
2. Build a complete decision tree as Mermaid flowchart syntax
   - Start with: flowchart TD
   - Decision nodes MUST have matching braces: {Question?} (NOT {Question? without closing brace)
   - Process nodes use square brackets: [Action]
   - Conditional edges: -->|Yes| or -->|No|
   - Each node on its own line
   - VALID example:
     flowchart TD
         A[Start] --> B{Is valid?}
         B -->|Yes| C[Process]
         B -->|No| D[Reject]
   - INVALID (missing closing brace): A --> B{Is valid?  (WRONG!)
3. List every rule with clear IF/THEN format
4. Identify all variables and their constraints
5. Note any ambiguities as open questions

Return ONLY valid JSON.`;

export const EXTRACTION_CONFIG = {
  model: "gpt-4o",
};

/**
 * Build the extraction prompt with the interview transcript
 */
export function buildExtractionPrompt(
  initialDescription: string,
  messages: Array<{ role: string; content: string }>
): string {
  const transcript = messages
    .map((m) => `${m.role === "assistant" ? "BridgeSpec" : "Expert"}: ${m.content}`)
    .join("\n\n");

  return `## Initial Description
${initialDescription}

## Interview Transcript
${transcript}

## Extract Knowledge
Analyze the above interview and extract structured knowledge as JSON:`;
}
