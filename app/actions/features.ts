"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { BABOK_PHASES } from "@/config/babok-phases";

export interface FeatureData {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    specifications?: SpecificationSummary[];
    project?: {
        id: string;
        name: string;
        methodology: string;
    };
}

export interface SpecificationSummary {
    id: string;
    featureId: string;
    phaseId: string | null;
    name: string;
    status: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

// Get a single feature with its specifications
export async function getFeature(id: string): Promise<FeatureData | null> {
    console.log("[getFeature] Looking for feature:", id);

    const feature = await prisma.feature.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    methodology: true,
                },
            },
            specifications: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    featureId: true,
                    phaseId: true,
                    name: true,
                    status: true,
                    order: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    console.log("[getFeature] Result:", feature ? { id: feature.id, name: feature.name } : "NOT FOUND");

    if (!feature) return null;

    return {
        id: feature.id,
        projectId: feature.projectId,
        name: feature.name,
        description: feature.description,
        order: feature.order,
        createdAt: feature.createdAt.toISOString(),
        updatedAt: feature.updatedAt.toISOString(),
        project: {
            id: feature.project.id,
            name: feature.project.name,
            methodology: feature.project.methodology,
        },
        specifications: feature.specifications.map((s) => ({
            id: s.id,
            featureId: s.featureId,
            phaseId: s.phaseId,
            name: s.name,
            status: s.status,
            order: s.order,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
        })),
    };
}

// Alias for getFeature with project info (for backward compatibility and clarity)
export const getFeatureWithProject = getFeature;

// Create a new feature
export async function createFeature(
    projectId: string,
    data: {
        name: string;
        description?: string;
    }
): Promise<FeatureData> {
    const { userId, orgId } = await auth();

    console.log("[createFeature] Auth context:", { userId: userId ?? "null", orgId: orgId ?? "null", projectId });

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Check project ownership (must match current context: org or personal)
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        console.log("[createFeature] Project not found:", projectId);
        throw new Error("Project not found");
    }

    console.log("[createFeature] Project found:", {
        id: project.id,
        userId: project.userId,
        organizationId: project.organizationId
    });

    // Verify access: either org matches or personal project matches user
    const hasAccess = orgId
        ? project.organizationId === orgId
        : project.userId === userId && !project.organizationId;

    console.log("[createFeature] Access check:", { hasAccess, orgId: orgId ?? "null", projectOrgId: project.organizationId ?? "null" });

    if (!hasAccess) {
        throw new Error("Unauthorized - access denied");
    }

    // Get the highest order number for this project
    const maxOrder = await prisma.feature.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
        select: { order: true },
    });

    const feature = await prisma.feature.create({
        data: {
            projectId,
            name: data.name,
            description: data.description ?? null,
            order: (maxOrder?.order ?? -1) + 1,
        },
    });

    console.log("[createFeature] Created feature:", { id: feature.id, name: feature.name, projectId: feature.projectId });

    // Auto-create phases for BABOK projects
    if (project.methodology === "babok") {
        await prisma.phase.createMany({
            data: BABOK_PHASES.map((phase) => ({
                featureId: feature.id,
                phaseNumber: phase.number,
                phaseName: phase.name,
                status: "not_started",
                order: phase.number,
            })),
        });
    }

    revalidatePath("/");

    return {
        id: feature.id,
        projectId: feature.projectId,
        name: feature.name,
        description: feature.description,
        order: feature.order,
        createdAt: feature.createdAt.toISOString(),
        updatedAt: feature.updatedAt.toISOString(),
        specifications: [],
    };
}

// Update a feature
export async function updateFeature(
    id: string,
    data: Partial<{
        name: string;
        description: string | null;
    }>
): Promise<FeatureData | null> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Check ownership by checking the project of the feature
    const existingFeature = await prisma.feature.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!existingFeature || !existingFeature.project) {
        throw new Error("Unauthorized");
    }

    // Verify access: either org matches or personal project matches user
    const hasAccess = orgId
        ? existingFeature.project.organizationId === orgId
        : existingFeature.project.userId === userId && !existingFeature.project.organizationId;

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    const feature = await prisma.feature.update({
        where: { id },
        data: {
            ...(data.name !== undefined && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
        },
        include: {
            specifications: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    featureId: true,
                    phaseId: true,
                    name: true,
                    status: true,
                    order: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    revalidatePath("/");

    return {
        id: feature.id,
        projectId: feature.projectId,
        name: feature.name,
        description: feature.description,
        order: feature.order,
        createdAt: feature.createdAt.toISOString(),
        updatedAt: feature.updatedAt.toISOString(),
        specifications: feature.specifications.map((s) => ({
            id: s.id,
            featureId: s.featureId,
            phaseId: s.phaseId,
            name: s.name,
            status: s.status,
            order: s.order,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
        })),
    };
}

// Delete a feature (cascades to specifications)
export async function deleteFeature(id: string): Promise<void> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Check ownership
    const existingFeature = await prisma.feature.findUnique({
        where: { id },
        include: { project: true }
    });

    if (!existingFeature || !existingFeature.project) {
        throw new Error("Unauthorized");
    }

    // Verify access: either org matches or personal project matches user
    const hasAccess = orgId
        ? existingFeature.project.organizationId === orgId
        : existingFeature.project.userId === userId && !existingFeature.project.organizationId;

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    await prisma.feature.delete({
        where: { id },
    });
    revalidatePath("/");
}

// Reorder features within a project
export async function reorderFeatures(
    projectId: string,
    featureIds: string[]
): Promise<void> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Check project ownership
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
        throw new Error("Unauthorized");
    }

    // Verify access: either org matches or personal project matches user
    const hasAccess = orgId
        ? project.organizationId === orgId
        : project.userId === userId && !project.organizationId;

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    // Update each feature's order based on its position in the array
    await Promise.all(
        featureIds.map((id, index) =>
            prisma.feature.update({
                where: { id },
                data: { order: index },
            })
        )
    );

    revalidatePath("/");
}

// Reorder specifications within a feature
export async function reorderSpecifications(
    featureId: string,
    specificationIds: string[]
): Promise<void> {
    const { userId, orgId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Check feature ownership (via project)
    const feature = await prisma.feature.findUnique({
        where: { id: featureId },
        include: { project: true }
    });

    if (!feature || !feature.project) {
        throw new Error("Unauthorized");
    }

    // Verify access: either org matches or personal project matches user
    const hasAccess = orgId
        ? feature.project.organizationId === orgId
        : feature.project.userId === userId && !feature.project.organizationId;

    if (!hasAccess) {
        throw new Error("Unauthorized");
    }

    // Update each specification's order based on its position in the array
    await Promise.all(
        specificationIds.map((id, index) =>
            prisma.specification.update({
                where: { id },
                data: { order: index },
            })
        )
    );

    revalidatePath("/");
}
