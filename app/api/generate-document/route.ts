import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const maxDuration = 300; // 5 minutes for long generation

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

interface ProjectDataBundle {
    project: {
        id: string;
        name: string;
        description: string | null;
        methodology: string;
    };
    features: {
        id: string;
        name: string;
        description: string | null;
        specifications: {
            id: string;
            name: string;
            initialDescription: string;
            status: string;
            messages: { role: string; content: string }[];
            artifacts: { type: string; title: string; data: unknown }[];
        }[];
    }[];
    standaloneSpecifications: {
        id: string;
        name: string;
        initialDescription: string;
        status: string;
        messages: { role: string; content: string }[];
        artifacts: { type: string; title: string; data: unknown }[];
    }[];
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

    // Verify access and collect data
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            features: {
                orderBy: { order: "asc" },
                include: {
                    specifications: {
                        orderBy: { order: "asc" },
                        include: {
                            messages: {
                                orderBy: { timestamp: "asc" },
                                select: { role: true, content: true },
                            },
                            artifacts: {
                                where: { status: "complete" },
                                select: { type: true, title: true, data: true },
                            },
                        },
                    },
                },
            },
            specifications: {
                where: { featureId: null },
                orderBy: { order: "asc" },
                include: {
                    messages: {
                        orderBy: { timestamp: "asc" },
                        select: { role: true, content: true },
                    },
                    artifacts: {
                        where: { status: "complete" },
                        select: { type: true, title: true, data: true },
                    },
                },
            },
        },
    });

    if (!project) {
        return new Response("Project not found", { status: 404 });
    }

    const hasAccess = project.userId === userId || (orgId && project.organizationId === orgId);
    if (!hasAccess) {
        return new Response("Unauthorized", { status: 403 });
    }

    // Build the data bundle
    const dataBundle: ProjectDataBundle = {
        project: {
            id: project.id,
            name: project.name,
            description: project.description,
            methodology: project.methodology,
        },
        features: project.features.map((f) => ({
            id: f.id,
            name: f.name,
            description: f.description,
            specifications: f.specifications.map((s) => ({
                id: s.id,
                name: s.name,
                initialDescription: s.initialDescription,
                status: s.status,
                messages: s.messages.map((m) => ({ role: m.role, content: m.content })),
                artifacts: s.artifacts.map((a) => ({
                    type: a.type,
                    title: a.title,
                    data: a.data,
                })),
            })),
        })),
        standaloneSpecifications: project.specifications.map((s) => ({
            id: s.id,
            name: s.name,
            initialDescription: s.initialDescription,
            status: s.status,
            messages: s.messages.map((m) => ({ role: m.role, content: m.content })),
            artifacts: s.artifacts.map((a) => ({
                type: a.type,
                title: a.title,
                data: a.data,
            })),
        })),
    };

    // Check if there's enough content to generate documentation
    const totalSpecs = dataBundle.features.reduce((acc, f) => acc + f.specifications.length, 0) + dataBundle.standaloneSpecifications.length;

    if (totalSpecs === 0) {
        await prisma.projectDocument.update({
            where: { id: documentId },
            data: {
                status: "error",
                error: "No specifications found. Add some specifications before generating documentation.",
            },
        });
        return new Response("No specifications found", { status: 400 });
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event: string, data: unknown) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                sendEvent("status", { step: "collecting", message: "Collecting project data..." });

                // Prepare the prompt
                const prompt = buildDocumentationPrompt(dataBundle);

                sendEvent("status", { step: "generating", message: "Generating documentation..." });

                // Stream the generation using OpenAI
                let fullContent = "";

                const openai = getOpenAI();
                const stream = await openai.chat.completions.create({
                    model: "gpt-4o",
                    max_tokens: 8000,
                    stream: true,
                    messages: [
                        {
                            role: "system",
                            content: "You are a senior business analyst creating comprehensive project documentation. Generate well-structured markdown documents that are professional and thorough.",
                        },
                        { role: "user", content: prompt },
                    ],
                });

                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) {
                        fullContent += text;
                        sendEvent("content", { text });
                    }
                }

                // Save the final document
                await prisma.projectDocument.update({
                    where: { id: documentId },
                    data: {
                        content: fullContent,
                        status: "complete",
                        metadata: {
                            featureCount: dataBundle.features.length,
                            specificationCount: totalSpecs,
                            generatedAt: new Date().toISOString(),
                        },
                    },
                });

                sendEvent("complete", { message: "Documentation generated successfully" });
                controller.close();
            } catch (error) {
                console.error("Document generation error:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";

                await prisma.projectDocument.update({
                    where: { id: documentId },
                    data: {
                        status: "error",
                        error: errorMessage,
                    },
                });

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

function buildDocumentationPrompt(data: ProjectDataBundle): string {
    // Summarize the data to fit in context
    let projectSummary = `# Project: ${data.project.name}\n`;
    if (data.project.description) {
        projectSummary += `Description: ${data.project.description}\n`;
    }
    projectSummary += `Methodology: ${data.project.methodology}\n\n`;

    // Add features and their specs
    let featuresSection = "## Features and Specifications\n\n";

    for (const feature of data.features) {
        featuresSection += `### Feature: ${feature.name}\n`;
        if (feature.description) {
            featuresSection += `${feature.description}\n`;
        }
        featuresSection += `\n`;

        for (const spec of feature.specifications) {
            featuresSection += `#### ${spec.name}\n`;
            if (spec.initialDescription) {
                featuresSection += `*${spec.initialDescription}*\n\n`;
            }

            // Add conversation summary (limit to key exchanges)
            if (spec.messages.length > 0) {
                featuresSection += "**Interview Summary:**\n";
                // Take first few and last few messages to capture context
                const messagesToInclude = spec.messages.length <= 10
                    ? spec.messages
                    : [...spec.messages.slice(0, 5), ...spec.messages.slice(-3)];

                for (const msg of messagesToInclude) {
                    const role = msg.role === "assistant" ? "Analyst" : "Expert";
                    // Truncate very long messages
                    const content = msg.content.length > 500 ? msg.content.slice(0, 500) + "..." : msg.content;
                    featuresSection += `- **${role}:** ${content}\n`;
                }
                featuresSection += "\n";
            }

            // Add artifacts
            for (const artifact of spec.artifacts) {
                featuresSection += `**${artifact.title} (${artifact.type}):**\n`;
                if (artifact.data && typeof artifact.data === "object") {
                    const artifactData = artifact.data as Record<string, unknown>;
                    if (artifactData.markdown) {
                        featuresSection += `${artifactData.markdown}\n`;
                    } else if (artifactData.mermaid) {
                        featuresSection += "```mermaid\n" + artifactData.mermaid + "\n```\n";
                    } else {
                        featuresSection += JSON.stringify(artifact.data, null, 2) + "\n";
                    }
                }
                featuresSection += "\n";
            }
        }
    }

    // Add standalone specifications
    if (data.standaloneSpecifications.length > 0) {
        featuresSection += "## Standalone Specifications\n\n";
        for (const spec of data.standaloneSpecifications) {
            featuresSection += `### ${spec.name}\n`;
            if (spec.initialDescription) {
                featuresSection += `*${spec.initialDescription}*\n\n`;
            }

            if (spec.messages.length > 0) {
                featuresSection += "**Interview Summary:**\n";
                const messagesToInclude = spec.messages.length <= 10
                    ? spec.messages
                    : [...spec.messages.slice(0, 5), ...spec.messages.slice(-3)];

                for (const msg of messagesToInclude) {
                    const role = msg.role === "assistant" ? "Analyst" : "Expert";
                    const content = msg.content.length > 500 ? msg.content.slice(0, 500) + "..." : msg.content;
                    featuresSection += `- **${role}:** ${content}\n`;
                }
                featuresSection += "\n";
            }

            for (const artifact of spec.artifacts) {
                featuresSection += `**${artifact.title} (${artifact.type}):**\n`;
                if (artifact.data && typeof artifact.data === "object") {
                    const artifactData = artifact.data as Record<string, unknown>;
                    if (artifactData.markdown) {
                        featuresSection += `${artifactData.markdown}\n`;
                    } else if (artifactData.mermaid) {
                        featuresSection += "```mermaid\n" + artifactData.mermaid + "\n```\n";
                    }
                }
                featuresSection += "\n";
            }
        }
    }

    return `Based on the following project data from expert interviews and generated artifacts, create a professional Business Requirements Document (BRD).

${projectSummary}
${featuresSection}

---

Generate a complete, well-structured BRD in markdown format. Include:

1. **Executive Summary** - Project purpose, goals, and high-level scope
2. **Feature Overview** - List of all features with brief descriptions and their relationships
3. **Detailed Requirements** - Consolidated requirements grouped by theme/domain
4. **Business Rules** - All business rules extracted from the interviews
5. **Process Flows** - Key workflows and decision points (reference any diagrams)
6. **Data Elements** - Variables, data types, and constraints identified
7. **Edge Cases & Exceptions** - Known edge cases and how they should be handled
8. **Open Questions** - Any unresolved items or areas needing clarification
9. **Glossary** - Key terms and definitions

Important guidelines:
- Use clear, professional language suitable for both technical and business stakeholders
- Include cross-references between related requirements
- Highlight any potential conflicts or gaps you identify
- Keep the document scannable with good use of headers and bullet points
- If information is missing for a section, note what additional interviews might be needed

Generate the document now:`;
}
