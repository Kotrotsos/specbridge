interface AgentTopic {
  id: string;
  name: string;
  description: string;
}

interface TopicCoverage {
  topicId: string;
  status: string;
  confidence: number;
}

interface AgentConfig {
  name: string;
  goal: string;
  topics: AgentTopic[];
  flexibility: string;
  personality: string;
  welcomeMessage?: string | null;
  topicsCovered?: TopicCoverage[];
}

const PERSONALITY_TONES: Record<string, string> = {
  professional: "Maintain a professional, business-like tone. Be precise and structured in your questions.",
  friendly: "Be warm, approachable, and conversational. Use a natural, friendly tone while staying focused.",
  casual: "Keep things relaxed and informal. Use simple language and make the conversation feel easy.",
  technical: "Use precise technical language. Be detail-oriented and don't shy away from technical depth.",
};

const FLEXIBILITY_RULES: Record<string, string> = {
  strict: `Follow the topics in order. Complete each topic before moving to the next.
Do not let the conversation drift to unrelated subjects.`,
  moderate: `Cover all topics but allow natural conversation flow. If the customer brings up
a related topic early, explore it. Gently redirect if the conversation drifts too far.`,
  flexible: `Let the conversation flow organically. Cover all topics eventually, but follow
the customer's lead. Explore tangents that might reveal useful requirements.`,
};

export function buildAgentSystemPrompt(config: AgentConfig): string {
  const tone = PERSONALITY_TONES[config.personality] || PERSONALITY_TONES.professional;
  const flexibility = FLEXIBILITY_RULES[config.flexibility] || FLEXIBILITY_RULES.moderate;

  const topicsList = config.topics.map((t, i) => {
    const covered = config.topicsCovered?.find(tc => tc.topicId === t.id);
    const status = covered
      ? ` [Coverage: ${Math.round(covered.confidence * 100)}%]`
      : " [Not yet covered]";
    return `${i + 1}. **${t.name}**${status}\n   ${t.description}`;
  }).join("\n");

  return `You are a requirements gathering agent for "${config.name}".

## Your Goal
${config.goal}

## Communication Style
${tone}

## Topic Coverage Rules
${flexibility}

## Required Topics
You must gather information about ALL of the following topics:

${topicsList}

## Instructions
- Ask focused, open-ended questions to understand the customer's needs
- Listen carefully and ask follow-up questions to dig deeper
- When you feel a topic is sufficiently covered (you have clear, actionable requirements), move on
- Keep your responses concise, one question or topic at a time
- Acknowledge what the customer says before moving to the next question
- If the customer's answer is vague, ask for specific examples or scenarios
- NEVER reveal the internal topic list or coverage status to the customer
- NEVER mention that you are tracking topics or coverage
- When ALL topics have been covered with sufficient detail, include the marker [ALL_TOPICS_COVERED] at the end of your final message
- Provide a brief summary of what you've gathered before ending

## Important
- You are speaking directly with a customer or stakeholder
- Your job is to understand their requirements, not to provide solutions
- Be respectful of their time, keep the conversation efficient
- If they seem unsure about something, note it as a gap rather than pressing too hard`;
}

export function buildAgentWelcomeMessage(config: AgentConfig): string {
  if (config.welcomeMessage) {
    return config.welcomeMessage;
  }

  // Pick the first topic to ask about immediately
  const firstTopic = config.topics[0];
  const topicPrompt = firstTopic
    ? `\n\nTo start, could you tell me about your needs regarding **${firstTopic.name}**?${firstTopic.description ? ` Specifically, ${firstTopic.description.charAt(0).toLowerCase() + firstTopic.description.slice(1)}` : ""}`
    : "\n\nTo start, could you give me a high-level overview of what you're looking for?";

  const greetings: Record<string, string> = {
    professional: `Hello, and thank you for taking the time to speak with me today. I'm here to help gather your requirements for ${config.name}. I'll walk you through a few key areas to make sure we capture everything.${topicPrompt}`,
    friendly: `Hi there! Thanks so much for chatting with me today. I'm here to learn about what you need for ${config.name}, and I'll guide you through a few topics to make sure we don't miss anything.${topicPrompt}`,
    casual: `Hey! Thanks for taking the time. I'll walk you through a few things about ${config.name} to make sure we get everything right.${topicPrompt}`,
    technical: `Hello. I'll be conducting a structured requirements gathering session for ${config.name}. I'll cover several areas in detail.${topicPrompt}`,
  };

  return greetings[config.personality] || greetings.professional;
}

export function buildAnalysisPrompt(
  config: AgentConfig,
  transcript: string
): string {
  const topicsList = config.topics.map(t =>
    `- "${t.name}": ${t.description}`
  ).join("\n");

  return `Analyze this requirements gathering conversation and extract structured data.

## Agent Configuration
Goal: ${config.goal}
Required Topics:
${topicsList}

## Conversation Transcript
${transcript}

## Task
Analyze the conversation and return a JSON object with the following structure:

{
  "topicsCovered": [
    {
      "topicId": "topic-id",
      "topicName": "topic name",
      "status": "not_started|in_progress|covered",
      "confidence": 0.0-1.0,
      "keyPoints": ["point 1", "point 2"]
    }
  ],
  "requirements": [
    {
      "id": "req-1",
      "description": "clear requirement statement",
      "topicId": "related-topic-id",
      "priority": "high|medium|low",
      "sourceQuote": "exact customer words"
    }
  ],
  "decisions": [
    {
      "description": "decision made",
      "rationale": "why",
      "sourceQuote": "customer words"
    }
  ],
  "gaps": [
    {
      "description": "what information is missing",
      "topicId": "related-topic-id",
      "impact": "why this matters"
    }
  ],
  "overallConfidence": 0.0-1.0
}

Rules:
- confidence per topic: 0 = not discussed, 0.3 = briefly mentioned, 0.6 = partially covered, 0.8+ = well covered
- overallConfidence is the weighted average across all topics
- sourceQuote must be actual customer words from the transcript
- requirements should be clear, actionable statements
- gaps should identify what still needs clarification

Return ONLY valid JSON. No markdown code blocks, no explanations.`;
}

export const ANALYSIS_SYSTEM_PROMPT = `You are a requirements analysis engine. You analyze interview transcripts and extract structured requirements data. You always return valid JSON. Be precise and thorough in your analysis. Only extract information that is clearly stated or strongly implied by the customer's words.`;
