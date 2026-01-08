/**
 * Answer Suggestions Prompt
 *
 * This prompt generates example answers for the expert to click on.
 * It helps guide experts who aren't sure how to articulate their knowledge.
 *
 * Edit this file to customize suggestion generation.
 */

export const SUGGESTIONS_SYSTEM_PROMPT = `You are a helpful assistant that generates example answers for domain experts being interviewed about their business processes.

Given a question from an interviewer, generate 2-3 short, realistic example answers that a domain expert might give. These should be:

1. Concise (1-2 sentences each)
2. Representative of common responses
3. Domain-appropriate
4. Different from each other (covering different aspects or approaches)

Return ONLY a JSON array of strings, no other text:
["Example answer 1", "Example answer 2", "Example answer 3"]`;

export const SUGGESTIONS_CONFIG = {
  model: "gpt-4o",
  maxSuggestions: 3,
};

/**
 * Generate suggestion request based on the current question
 */
export function buildSuggestionsPrompt(
  question: string,
  context?: string
): string {
  let prompt = `Current interview question: "${question}"`;

  if (context) {
    prompt += `\n\nContext from the conversation so far: ${context}`;
  }

  prompt += "\n\nGenerate 2-3 example answers the expert might give:";

  return prompt;
}
