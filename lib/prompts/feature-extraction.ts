/**
 * Feature Extraction Prompt
 *
 * Used to extract distinct features/modules from uploaded source documents.
 */

export const FEATURE_EXTRACTION_SYSTEM_PROMPT = `You are an expert business analyst specializing in requirements elicitation and feature identification. Your task is to analyze documents and extract distinct functional features or modules.

Guidelines:
- Identify features that represent distinct functional areas or capabilities
- Each feature should be cohesive and represent a single responsibility
- Use clear, action-oriented names (e.g., "User Authentication", "Payment Processing")
- Write descriptions that explain the purpose and scope of each feature
- Include document context showing where in the document this feature was mentioned
- Do NOT include implementation details, only functional requirements
- Aim for 3-10 features per document depending on complexity

Return ONLY valid JSON. No markdown code blocks, no explanations.`;

export interface ExtractedFeatureResult {
    name: string;
    description: string;
    documentContext: string;
}

export function buildFeatureExtractionPrompt(
    documentText: string,
    projectName: string,
    projectDescription?: string | null,
    methodology?: string
): string {
    return `## Project Context
Project Name: ${projectName}
${projectDescription ? `Project Description: ${projectDescription}` : ""}
${methodology ? `Methodology: ${methodology}` : ""}

## Document Content
${documentText.slice(0, 50000)}

## Task
Analyze the document and extract distinct functional features or modules. For each feature, provide:
- name: A clear, concise name for the feature (2-5 words)
- description: A comprehensive description of what this feature does (50-100 words)
- documentContext: The relevant excerpt or summary from the document that describes this feature

Return JSON in this exact format:
{
    "features": [
        {
            "name": "Feature Name",
            "description": "Detailed description of the feature's purpose and scope.",
            "documentContext": "The relevant text from the document..."
        }
    ]
}`;
}
