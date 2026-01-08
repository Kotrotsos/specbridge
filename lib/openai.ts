import OpenAI from "openai";

/**
 * OpenAI Client Configuration
 *
 * Uses the OpenAI Chat Completions API for text generation.
 */

// Lazy-initialize client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate a response using the OpenAI Chat Completions API
 *
 * @param input - The user input (string or message array)
 * @param instructions - System instructions for the model
 * @returns The generated text response
 */
export async function generateResponse(
  input: string | Array<{ role: "developer" | "user" | "assistant"; content: string }>,
  instructions: string
): Promise<string> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: instructions },
  ];

  if (typeof input === "string") {
    messages.push({ role: "user", content: input });
  } else {
    for (const msg of input) {
      if (msg.role === "developer") {
        messages.push({ role: "system", content: msg.content });
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Generate answer suggestions for the current question
 *
 * @param question - The current interview question
 * @param systemPrompt - System prompt for suggestion generation
 * @returns Array of suggested answers
 */
export async function generateSuggestions(
  question: string,
  systemPrompt: string
): Promise<string[]> {
  const response = await generateResponse(question, systemPrompt);

  try {
    // Parse JSON array from response
    const suggestions = JSON.parse(response);
    if (Array.isArray(suggestions)) {
      return suggestions.slice(0, 3);
    }
  } catch {
    // If parsing fails, return empty array
    console.error("Failed to parse suggestions:", response);
  }

  return [];
}

/**
 * Extract knowledge from a completed interview
 *
 * @param prompt - The extraction prompt with transcript
 * @param systemPrompt - System prompt for extraction
 * @returns Extracted knowledge object
 */
export async function extractKnowledge(
  prompt: string,
  systemPrompt: string
): Promise<unknown> {
  const response = await generateResponse(prompt, systemPrompt);

  try {
    // Strip markdown code blocks if present
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // Parse JSON from response
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse extraction:", response);
    // Return raw response wrapped in an object so user can see what went wrong
    return {
      error: "Failed to parse response",
      rawResponse: response.slice(0, 500)
    };
  }
}
