import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import {
    VISUALIZATION_ANALYSIS_SYSTEM_PROMPT,
    VISUALIZATION_GENERATION_SYSTEM_PROMPT,
    buildVisualizationAnalysisPrompt,
    buildVisualizationGenerationPrompt,
    VisualizationPlan,
} from "@/lib/prompts/visualizations";

export const maxDuration = 300; // 5 minutes for multi-diagram generation

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

interface DocumentSection {
    heading: string;
    level: number;
    startLine: number;
    endLine: number;
    content: string;
}

function parseDocumentSections(content: string): DocumentSection[] {
    const lines = content.split("\n");
    const sections: DocumentSection[] = [];
    let currentSection: DocumentSection | null = null;

    for (let i = 0; i < lines.length; i++) {
        const headingMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            if (currentSection) {
                currentSection.endLine = i - 1;
                currentSection.content = lines
                    .slice(currentSection.startLine, i)
                    .join("\n");
            }
            currentSection = {
                heading: lines[i],
                level: headingMatch[1].length,
                startLine: i,
                endLine: lines.length - 1,
                content: "",
            };
            sections.push(currentSection);
        }
    }

    if (currentSection) {
        currentSection.endLine = lines.length - 1;
        currentSection.content = lines
            .slice(currentSection.startLine)
            .join("\n");
    }

    return sections;
}

function findSectionForVisualization(
    sections: DocumentSection[],
    targetHeading: string
): DocumentSection | null {
    // Exact match first
    const exact = sections.find((s) => s.heading === targetHeading);
    if (exact) return exact;

    // Try matching without the ## prefix
    const headingText = targetHeading.replace(/^#{1,6}\s+/, "").toLowerCase();
    const fuzzy = sections.find(
        (s) => s.heading.replace(/^#{1,6}\s+/, "").toLowerCase() === headingText
    );
    if (fuzzy) return fuzzy;

    // Try substring match
    const partial = sections.find((s) =>
        s.heading
            .replace(/^#{1,6}\s+/, "")
            .toLowerCase()
            .includes(headingText)
    );
    if (partial) return partial;

    // Reverse substring match
    const reversePartial = sections.find((s) =>
        headingText.includes(
            s.heading.replace(/^#{1,6}\s+/, "").toLowerCase()
        )
    );
    return reversePartial || null;
}

function insertVisualizationsIntoDocument(
    content: string,
    visualizations: { plan: VisualizationPlan; mermaid: string }[]
): string {
    const sections = parseDocumentSections(content);
    const lines = content.split("\n");

    // Group visualizations by their target section
    const insertions: { lineIndex: number; blocks: string[] }[] = [];
    const unmatched: { plan: VisualizationPlan; mermaid: string }[] = [];

    for (const viz of visualizations) {
        const section = findSectionForVisualization(
            sections,
            viz.plan.insertAfterHeading
        );
        if (section) {
            const existing = insertions.find(
                (i) => i.lineIndex === section.endLine
            );
            const block = `\n---\n\n**${viz.plan.title}**\n\n\`\`\`mermaid\n${viz.mermaid}\n\`\`\`\n`;
            if (existing) {
                existing.blocks.push(block);
            } else {
                insertions.push({
                    lineIndex: section.endLine,
                    blocks: [block],
                });
            }
        } else {
            unmatched.push(viz);
        }
    }

    // Sort insertions by line index descending so we can insert without shifting
    insertions.sort((a, b) => b.lineIndex - a.lineIndex);

    for (const insertion of insertions) {
        const blockContent = insertion.blocks.join("\n");
        lines.splice(insertion.lineIndex + 1, 0, blockContent);
    }

    let result = lines.join("\n");

    // Append unmatched visualizations at the end
    if (unmatched.length > 0) {
        result += "\n\n---\n\n## Visualizations\n";
        for (const viz of unmatched) {
            result += `\n**${viz.plan.title}**\n\n\`\`\`mermaid\n${viz.mermaid}\n\`\`\`\n`;
        }
    }

    return result;
}

export async function POST(request: Request) {
    const { userId, orgId } = await auth();

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { projectId, documentId } = await request.json();

    if (!projectId || !documentId) {
        return new Response("Missing projectId or documentId", { status: 400 });
    }

    // Verify access
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) {
        return new Response("Project not found", { status: 404 });
    }

    const hasAccess =
        project.userId === userId ||
        (orgId && project.organizationId === orgId);
    if (!hasAccess) {
        return new Response("Unauthorized", { status: 403 });
    }

    // Load the document
    const document = await prisma.projectDocument.findUnique({
        where: { id: documentId },
    });

    if (!document || document.status !== "complete") {
        return new Response("Document not found or not complete", {
            status: 400,
        });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: unknown) => {
                controller.enqueue(
                    encoder.encode(
                        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                    )
                );
            };

            try {
                const openai = getOpenAI();

                // Phase 1: Analysis
                sendEvent("status", {
                    step: "analyzing",
                    message: "Analyzing document for visualization opportunities...",
                });

                const analysisResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    max_tokens: 2000,
                    response_format: { type: "json_object" },
                    messages: [
                        {
                            role: "system",
                            content: VISUALIZATION_ANALYSIS_SYSTEM_PROMPT,
                        },
                        {
                            role: "user",
                            content: buildVisualizationAnalysisPrompt(
                                document.content,
                                project.name,
                                project.description
                            ),
                        },
                    ],
                });

                const analysisText =
                    analysisResponse.choices[0]?.message?.content;
                if (!analysisText) {
                    throw new Error("No analysis response from AI");
                }

                let plans: VisualizationPlan[];
                try {
                    const parsed = JSON.parse(analysisText);
                    plans = parsed.visualizations || [];
                } catch {
                    throw new Error("Failed to parse visualization analysis");
                }

                if (plans.length === 0) {
                    sendEvent("complete", {
                        count: 0,
                        message: "No visualization opportunities identified.",
                    });
                    controller.close();
                    return;
                }

                sendEvent("analysis", { visualizations: plans });
                sendEvent("status", {
                    step: "generating",
                    message: `Identified ${plans.length} visualizations. Starting generation...`,
                });

                // Phase 2: Generate each diagram
                const sections = parseDocumentSections(document.content);
                const generatedViz: {
                    plan: VisualizationPlan;
                    mermaid: string;
                }[] = [];

                for (let i = 0; i < plans.length; i++) {
                    const plan = plans[i];

                    sendEvent("status", {
                        step: "generating",
                        message: `Generating visualization ${i + 1}/${plans.length}: ${plan.title}...`,
                    });

                    // Find the relevant section for context
                    const section = findSectionForVisualization(
                        sections,
                        plan.insertAfterHeading
                    );
                    const sectionContent = section?.content || document.content.slice(0, 3000);

                    try {
                        const genResponse =
                            await openai.chat.completions.create({
                                model: "gpt-4o",
                                max_tokens: 1500,
                                messages: [
                                    {
                                        role: "system",
                                        content: VISUALIZATION_GENERATION_SYSTEM_PROMPT,
                                    },
                                    {
                                        role: "user",
                                        content: buildVisualizationGenerationPrompt(
                                            plan,
                                            sectionContent
                                        ),
                                    },
                                ],
                            });

                        let mermaidCode =
                            genResponse.choices[0]?.message?.content?.trim() ||
                            "";

                        // Strip markdown fencing if the model included it anyway
                        mermaidCode = mermaidCode
                            .replace(/^```mermaid\n?/, "")
                            .replace(/\n?```$/, "")
                            .trim();

                        if (mermaidCode) {
                            generatedViz.push({ plan, mermaid: mermaidCode });
                            sendEvent("visualization", {
                                index: i + 1,
                                total: plans.length,
                                title: plan.title,
                                type: plan.type,
                                mermaid: mermaidCode,
                            });
                        }
                    } catch (error) {
                        console.error(
                            `Failed to generate visualization ${i + 1}:`,
                            error
                        );
                        // Continue with remaining visualizations
                    }
                }

                if (generatedViz.length === 0) {
                    sendEvent("complete", {
                        count: 0,
                        message: "No visualizations could be generated.",
                    });
                    controller.close();
                    return;
                }

                // Phase 3: Assembly
                sendEvent("status", {
                    step: "assembling",
                    message: "Inserting visualizations into document...",
                });

                const enhancedContent = insertVisualizationsIntoDocument(
                    document.content,
                    generatedViz
                );

                // Update the document
                const existingMetadata =
                    (document.metadata as Record<string, unknown>) || {};
                await prisma.projectDocument.update({
                    where: { id: documentId },
                    data: {
                        content: enhancedContent,
                        metadata: {
                            ...existingMetadata,
                            visualizations: {
                                addedAt: new Date().toISOString(),
                                count: generatedViz.length,
                                types: generatedViz.map((v) => v.plan.type),
                                titles: generatedViz.map((v) => v.plan.title),
                            },
                        },
                    },
                });

                sendEvent("complete", {
                    count: generatedViz.length,
                    message: `Added ${generatedViz.length} visualizations to the document.`,
                });
                controller.close();
            } catch (error) {
                console.error("Visualization generation error:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                sendEvent("error", { message: errorMessage });
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
