/**
 * Specification Extraction Prompt
 *
 * Used to extract specifications for a specific feature from the document.
 */

export const SPECIFICATION_EXTRACTION_SYSTEM_PROMPT = `You are an expert business analyst specializing in requirements specification. Your task is to extract detailed specifications for a specific feature from a document.

Guidelines:
- Focus only on specifications related to the given feature
- Each specification should be specific and testable
- Write rich initial descriptions (50-200 words) that frontload key information
- Include enough context that someone could start an interview about this specification
- Capture business rules, constraints, and acceptance criteria mentioned in the document
- Do NOT include implementation details unless they represent requirements

Return ONLY valid JSON. No markdown code blocks, no explanations.`;

export interface ExtractedSpecResult {
    name: string;
    initialDescription: string;
    documentContext: string;
}

export function buildSpecificationExtractionPrompt(
    documentText: string,
    featureName: string,
    featureDescription: string,
    allFeatureNames: string[]
): string {
    return `## Feature to Extract Specifications For
Feature Name: ${featureName}
Feature Description: ${featureDescription}

## All Features in This Document (for context)
${allFeatureNames.map((name) => `- ${name}`).join("\n")}

## Document Content
${documentText.slice(0, 50000)}

## Task
Extract specifications for the feature "${featureName}" from the document. For each specification:
- name: A clear name for the specification (e.g., "User login with email and password")
- initialDescription: A comprehensive description (50-200 words) that frontloads the most important information. Include:
  - What this specification covers
  - Key business rules or constraints
  - Expected behavior
  - Any edge cases mentioned in the document
- documentContext: The relevant excerpt from the document

Return JSON in this exact format:
{
    "featureName": "${featureName}",
    "specifications": [
        {
            "name": "Specification Name",
            "initialDescription": "Comprehensive description with key information frontloaded. Include business rules, constraints, and expected behavior...",
            "documentContext": "The relevant text from the document..."
        }
    ]
}`;
}
