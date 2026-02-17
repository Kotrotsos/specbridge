import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import {
    FEATURE_EXTRACTION_SYSTEM_PROMPT,
    buildFeatureExtractionPrompt,
    ExtractedFeatureResult,
} from "@/lib/prompts/feature-extraction";
import {
    SPECIFICATION_EXTRACTION_SYSTEM_PROMPT,
    buildSpecificationExtractionPrompt,
    ExtractedSpecResult,
} from "@/lib/prompts/specification-extraction";

export const maxDuration = 300; // 5 minutes for long extraction

// Lazy-initialize client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

interface ExtractionEvent {
    type: "status" | "feature" | "specification" | "complete" | "error";
    data: unknown;
}

export async function POST(request: Request) {
    const { userId, orgId } = await auth();

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
        return new Response("Missing documentId", { status: 400 });
    }

    // Get the document and verify access
    const document = await prisma.projectSourceDocument.findUnique({
        where: { id: documentId },
        include: {
            project: true,
        },
    });

    if (!document) {
        return new Response("Document not found", { status: 404 });
    }

    const hasAccess =
        document.project.userId === userId ||
        (orgId && document.project.organizationId === orgId);

    if (!hasAccess) {
        return new Response("Unauthorized", { status: 403 });
    }

    if (!document.extractedText) {
        return new Response("Document text not extracted yet", { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: ExtractionEvent) => {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                );
            };

            try {
                // Update status to extracting
                await prisma.projectSourceDocument.update({
                    where: { id: documentId },
                    data: { extractionStatus: "extracting_features" },
                });

                sendEvent({
                    type: "status",
                    data: {
                        phase: 1,
                        message: "Analyzing document for features...",
                    },
                });

                // Phase 1: Extract features
                const featurePrompt = buildFeatureExtractionPrompt(
                    document.extractedText!,
                    document.project.name,
                    document.project.description,
                    document.project.methodology
                );

                const openai = getOpenAI();
                const featureResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: FEATURE_EXTRACTION_SYSTEM_PROMPT },
                        { role: "user", content: featurePrompt },
                    ],
                    response_format: { type: "json_object" },
                });

                const featureContent = featureResponse.choices[0]?.message?.content;
                if (!featureContent) {
                    throw new Error("No response from AI for feature extraction");
                }

                let extractedFeatures: ExtractedFeatureResult[];
                try {
                    const parsed = JSON.parse(featureContent);
                    extractedFeatures = parsed.features || [];
                } catch {
                    throw new Error("Failed to parse feature extraction response");
                }

                if (extractedFeatures.length === 0) {
                    throw new Error("No features found in document");
                }

                // Send each feature as it's extracted
                for (const feature of extractedFeatures) {
                    sendEvent({
                        type: "feature",
                        data: feature,
                    });
                }

                // Update status
                await prisma.projectSourceDocument.update({
                    where: { id: documentId },
                    data: {
                        extractionStatus: "extracting_specs",
                        extractedFeatures: JSON.parse(JSON.stringify(extractedFeatures)),
                    },
                });

                sendEvent({
                    type: "status",
                    data: {
                        phase: 2,
                        message: `Extracting specifications for ${extractedFeatures.length} features...`,
                        featureCount: extractedFeatures.length,
                    },
                });

                // Phase 2: Extract specifications for each feature
                const allFeatureNames = extractedFeatures.map((f) => f.name);
                const extractedSpecs: {
                    featureName: string;
                    specifications: ExtractedSpecResult[];
                }[] = [];

                for (let i = 0; i < extractedFeatures.length; i++) {
                    const feature = extractedFeatures[i];

                    sendEvent({
                        type: "status",
                        data: {
                            phase: 2,
                            message: `Extracting specifications for "${feature.name}" (${i + 1}/${extractedFeatures.length})...`,
                            currentFeature: feature.name,
                            progress: i + 1,
                            total: extractedFeatures.length,
                        },
                    });

                    const specPrompt = buildSpecificationExtractionPrompt(
                        document.extractedText!,
                        feature.name,
                        feature.description,
                        allFeatureNames
                    );

                    const specResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            { role: "system", content: SPECIFICATION_EXTRACTION_SYSTEM_PROMPT },
                            { role: "user", content: specPrompt },
                        ],
                        response_format: { type: "json_object" },
                    });

                    const specContent = specResponse.choices[0]?.message?.content;
                    if (specContent) {
                        try {
                            const parsed = JSON.parse(specContent);
                            const specs = parsed.specifications || [];

                            extractedSpecs.push({
                                featureName: feature.name,
                                specifications: specs,
                            });

                            // Send specifications for this feature
                            for (const spec of specs) {
                                sendEvent({
                                    type: "specification",
                                    data: {
                                        featureName: feature.name,
                                        specification: spec,
                                    },
                                });
                            }
                        } catch (error) {
                            console.error(`Failed to parse specs for ${feature.name}:`, error);
                            // Continue with other features even if one fails
                        }
                    }
                }

                // Update document with all extracted content
                await prisma.projectSourceDocument.update({
                    where: { id: documentId },
                    data: {
                        extractionStatus: "complete",
                        extractedFeatures: JSON.parse(JSON.stringify(extractedFeatures)),
                        extractedSpecs: JSON.parse(JSON.stringify(extractedSpecs)),
                    },
                });

                // Calculate totals
                const totalSpecs = extractedSpecs.reduce(
                    (acc, group) => acc + group.specifications.length,
                    0
                );

                sendEvent({
                    type: "complete",
                    data: {
                        featureCount: extractedFeatures.length,
                        specificationCount: totalSpecs,
                        message: `Extraction complete: ${extractedFeatures.length} features, ${totalSpecs} specifications`,
                    },
                });

                controller.close();
            } catch (error) {
                console.error("Extraction error:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";

                await prisma.projectSourceDocument.update({
                    where: { id: documentId },
                    data: {
                        extractionStatus: "error",
                        error: errorMessage,
                    },
                });

                sendEvent({
                    type: "error",
                    data: { message: errorMessage },
                });

                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}
