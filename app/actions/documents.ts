"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface ProjectDocumentData {
    id: string;
    projectId: string;
    content: string;
    version: number;
    status: string;
    metadata: Record<string, unknown> | null;
    error: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectDataBundle {
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

// Get the latest document for a project
export async function getProjectDocument(projectId: string): Promise<ProjectDocumentData | null> {
    const document = await prisma.projectDocument.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
    });

    if (!document) return null;

    return {
        id: document.id,
        projectId: document.projectId,
        content: document.content,
        version: document.version,
        status: document.status,
        metadata: document.metadata as Record<string, unknown> | null,
        error: document.error,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
    };
}

// Collect all project data for documentation generation
export async function collectProjectData(projectId: string): Promise<ProjectDataBundle | null> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

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

    if (!project) return null;

    // Verify access
    const hasAccess = project.userId === userId || (orgId && project.organizationId === orgId);
    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    return {
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
}

// Create a new document (called when generation starts)
export async function createProjectDocument(projectId: string): Promise<ProjectDocumentData> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Verify project access
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new Error("Project not found");
    }

    const hasAccess = project.userId === userId || (orgId && project.organizationId === orgId);
    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    // Get the latest version number
    const latestDoc = await prisma.projectDocument.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
        select: { version: true },
    });

    const document = await prisma.projectDocument.create({
        data: {
            projectId,
            content: "",
            version: (latestDoc?.version ?? 0) + 1,
            status: "generating",
        },
    });

    revalidatePath(`/project/${projectId}`);

    return {
        id: document.id,
        projectId: document.projectId,
        content: document.content,
        version: document.version,
        status: document.status,
        metadata: null,
        error: null,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
    };
}

// Update document content (called during streaming)
export async function updateProjectDocument(
    documentId: string,
    data: {
        content?: string;
        status?: string;
        metadata?: object;
        error?: string;
    }
): Promise<void> {
    await prisma.projectDocument.update({
        where: { id: documentId },
        data: {
            ...(data.content !== undefined && { content: data.content }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.metadata !== undefined && { metadata: data.metadata as object }),
            ...(data.error !== undefined && { error: data.error }),
        },
    });
}

// Remove visualizations from a document (strips mermaid blocks added by the visualization feature)
export async function removeDocumentVisualizations(documentId: string): Promise<ProjectDocumentData | null> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const document = await prisma.projectDocument.findUnique({
        where: { id: documentId },
        include: { project: true },
    });

    if (!document) {
        throw new Error("Document not found");
    }

    const hasAccess =
        document.project.userId === userId ||
        (orgId && document.project.organizationId === orgId);

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    // Remove visualization blocks: ---\n\n**Title**\n\n```mermaid\n...\n```
    let content = document.content;
    content = content.replace(
        /\n---\n\n\*\*[^*]+\*\*\n\n```mermaid\n[\s\S]*?```\n/g,
        ""
    );

    // Remove trailing "Visualizations" appendix section if it exists
    content = content.replace(
        /\n\n---\n\n## Visualizations\n[\s\S]*$/,
        ""
    );

    // Update metadata to remove visualization info
    const existingMetadata = (document.metadata as Record<string, unknown>) || {};
    const { visualizations: _, ...restMetadata } = existingMetadata;

    const updated = await prisma.projectDocument.update({
        where: { id: documentId },
        data: {
            content,
            metadata: JSON.parse(JSON.stringify(restMetadata)),
        },
    });

    revalidatePath(`/project/${document.projectId}`);

    return {
        id: updated.id,
        projectId: updated.projectId,
        content: updated.content,
        version: updated.version,
        status: updated.status,
        metadata: updated.metadata as Record<string, unknown> | null,
        error: updated.error,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
    };
}

// Delete a document
export async function deleteProjectDocument(documentId: string): Promise<void> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const document = await prisma.projectDocument.findUnique({
        where: { id: documentId },
        include: { project: true },
    });

    if (!document) {
        throw new Error("Document not found");
    }

    const hasAccess =
        document.project.userId === userId ||
        (orgId && document.project.organizationId === orgId);

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    await prisma.projectDocument.delete({
        where: { id: documentId },
    });

    revalidatePath(`/project/${document.projectId}`);
}
