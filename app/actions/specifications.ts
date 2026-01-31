"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type MessageRole = "assistant" | "user";
export type ArtifactType = "overview" | "decision-tree" | "rules" | "variables" | "edge-cases";
export type ArtifactStatus = "generating" | "complete" | "error";
export type SpecificationStatus = "in_progress" | "complete";

export interface MessageData {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ArtifactData {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  data: Record<string, unknown> | null;
  error?: string;
  createdAt: string;
}

export interface SpecificationData {
  id: string;
  projectId: string;
  featureId: string | null;
  name: string;
  initialDescription: string;
  specificationType: string;
  status: SpecificationStatus;
  messages: MessageData[];
  artifacts: ArtifactData[];
  extractedKnowledge: object | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    methodology: string;
  };
  feature?: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
      methodology: string;
    };
  } | null;
  // BABOK phase information (if linked to a phase)
  phase?: {
    id: string;
    phaseNumber: number;
    phaseName: string;
  } | null;
}

// Get all specifications for a feature
export async function getAllSpecifications(featureId: string): Promise<SpecificationData[]> {
  const specifications = await prisma.specification.findMany({
    where: { featureId },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return specifications.map((spec) => ({
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: spec.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: spec.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: spec.extractedKnowledge as object | null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
  }));
}

// Get all standalone specifications for a project (not under any feature)
export async function getProjectSpecifications(projectId: string): Promise<SpecificationData[]> {
  const specifications = await prisma.specification.findMany({
    where: { projectId, featureId: null },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return specifications.map((spec) => ({
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: spec.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: spec.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: spec.extractedKnowledge as object | null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
  }));
}

// Get a single specification by ID
export async function getSpecification(id: string): Promise<SpecificationData | null> {
  const spec = await prisma.specification.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          methodology: true,
        },
      },
      feature: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              name: true,
              methodology: true,
            },
          },
        },
      },
      phase: {
        select: {
          id: true,
          phaseNumber: true,
          phaseName: true,
        },
      },
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!spec) return null;

  return {
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: spec.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: spec.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: spec.extractedKnowledge as object | null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
    project: {
      id: spec.project.id,
      name: spec.project.name,
      methodology: spec.project.methodology,
    },
    feature: spec.feature ? {
      id: spec.feature.id,
      name: spec.feature.name,
      project: {
        id: spec.feature.project.id,
        name: spec.feature.project.name,
        methodology: spec.feature.project.methodology,
      },
    } : null,
    phase: spec.phase ? {
      id: spec.phase.id,
      phaseNumber: spec.phase.phaseNumber,
      phaseName: spec.phase.phaseName,
    } : null,
  };
}

// Create a new specification
// Can be created under a feature (featureId) or directly under a project (projectId)
export async function createSpecification(data: {
  id: string;
  projectId?: string;  // Required if no featureId
  featureId?: string;  // Optional - if provided, projectId is derived from feature
  phaseId?: string;
  name: string;
  initialDescription: string;
  specificationType?: string;
  status?: SpecificationStatus;
}): Promise<SpecificationData> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  let projectId: string;
  let featureId: string | null = null;

  if (data.featureId) {
    // Creating under a feature - get projectId from feature
    const feature = await prisma.feature.findUnique({
      where: { id: data.featureId },
      include: { project: true }
    });

    if (!feature || !feature.project) {
      throw new Error("Feature not found");
    }

    // Verify access
    const hasAccess =
      feature.project.userId === userId ||
      (orgId && feature.project.organizationId === orgId);

    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    projectId = feature.projectId;
    featureId = data.featureId;
  } else if (data.projectId) {
    // Creating directly under project (standalone spec)
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Verify access
    const hasAccess =
      project.userId === userId ||
      (orgId && project.organizationId === orgId);

    if (!hasAccess) {
      throw new Error("Unauthorized");
    }

    projectId = data.projectId;
  } else {
    throw new Error("Either projectId or featureId must be provided");
  }

  // Get the highest order number for the scope (feature or project-level)
  const maxOrder = await prisma.specification.findFirst({
    where: featureId
      ? { featureId }
      : { projectId, featureId: null },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const spec = await prisma.specification.create({
    data: {
      id: data.id,
      projectId,
      featureId,
      phaseId: data.phaseId ?? null,
      name: data.name,
      initialDescription: data.initialDescription,
      specificationType: data.specificationType ?? "user_story",
      status: data.status ?? "in_progress",
      order: (maxOrder?.order ?? -1) + 1,
    },
    include: {
      messages: true,
      artifacts: true,
    },
  });

  revalidatePath("/");

  return {
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: [],
    artifacts: [],
    extractedKnowledge: null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
  };
}

// Update specification details
export async function updateSpecification(
  id: string,
  data: Partial<{
    name: string;
    initialDescription: string;
    specificationType: string;
    status: SpecificationStatus;
    extractedKnowledge: object | null;
    featureId: string | null; // Allow moving to different feature or making standalone
  }>
): Promise<SpecificationData | null> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership via project
  const existingSpec = await prisma.specification.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!existingSpec || !existingSpec.project) {
    throw new Error("Specification not found");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    existingSpec.project.userId === userId ||
    (orgId && existingSpec.project.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // If moving to a different feature, verify the feature belongs to the same project
  if (data.featureId !== undefined && data.featureId !== null) {
    const targetFeature = await prisma.feature.findUnique({
      where: { id: data.featureId }
    });
    if (!targetFeature || targetFeature.projectId !== existingSpec.projectId) {
      throw new Error("Target feature must belong to the same project");
    }
  }

  // Transform data for Prisma (handle null for JSON fields)
  const prismaData: Prisma.SpecificationUpdateInput = {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.initialDescription !== undefined && { initialDescription: data.initialDescription }),
    ...(data.specificationType !== undefined && { specificationType: data.specificationType }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.extractedKnowledge !== undefined && {
      extractedKnowledge: data.extractedKnowledge === null
        ? Prisma.JsonNull
        : data.extractedKnowledge,
    }),
    ...(data.featureId !== undefined && {
      feature: data.featureId === null
        ? { disconnect: true }
        : { connect: { id: data.featureId } },
    }),
  };

  const spec = await prisma.specification.update({
    where: { id },
    data: prismaData,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          methodology: true,
        },
      },
      feature: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              name: true,
              methodology: true,
            },
          },
        },
      },
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Revalidate to update sidebar when name or feature changes
  if (data.name !== undefined || data.featureId !== undefined) {
    revalidatePath("/");
  }

  return {
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: spec.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: spec.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: spec.extractedKnowledge as object | null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
    project: {
      id: spec.project.id,
      name: spec.project.name,
      methodology: spec.project.methodology,
    },
    feature: spec.feature ? {
      id: spec.feature.id,
      name: spec.feature.name,
      project: {
        id: spec.feature.project.id,
        name: spec.feature.project.name,
        methodology: spec.feature.project.methodology,
      },
    } : null,
  };
}

// Delete a specification
export async function deleteSpecification(id: string): Promise<void> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership via project
  const existingSpec = await prisma.specification.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!existingSpec) {
    throw new Error("Specification not found");
  }

  if (!existingSpec.project) {
    throw new Error("Specification has invalid structure");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    existingSpec.project.userId === userId ||
    (orgId && existingSpec.project.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  await prisma.specification.delete({
    where: { id },
  });
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

  // Check feature ownership
  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    include: { project: true }
  });

  if (!feature || !feature.project) {
    throw new Error("Unauthorized");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    feature.project.userId === userId ||
    (orgId && feature.project.organizationId === orgId);

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


// Add a message to a specification
export async function addMessage(
  specificationId: string,
  data: {
    id: string;
    role: MessageRole;
    content: string;
  }
): Promise<MessageData> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership via project
  const spec = await prisma.specification.findUnique({
    where: { id: specificationId },
    include: { project: true }
  });

  if (!spec || !spec.project) {
    throw new Error("Specification not found");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    spec.project.userId === userId ||
    (orgId && spec.project.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  const message = await prisma.message.create({
    data: {
      id: data.id,
      specificationId,
      role: data.role,
      content: data.content,
    },
  });

  // Update specification's updatedAt
  await prisma.specification.update({
    where: { id: specificationId },
    data: { updatedAt: new Date() },
  });

  return {
    id: message.id,
    role: message.role as MessageRole,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
  };
}

// Create or update an artifact
export async function upsertArtifact(
  specificationId: string,
  data: {
    id: string;
    type: ArtifactType;
    title: string;
    status: ArtifactStatus;
    data?: Record<string, unknown> | null;
    error?: string;
  }
): Promise<ArtifactData> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership via project
  const spec = await prisma.specification.findUnique({
    where: { id: specificationId },
    include: { project: true }
  });

  if (!spec || !spec.project) {
    throw new Error("Specification not found");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    spec.project.userId === userId ||
    (orgId && spec.project.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  // Handle null for JSON fields in Prisma
  const jsonData: Prisma.InputJsonValue | typeof Prisma.JsonNull =
    data.data === null || data.data === undefined
      ? Prisma.JsonNull
      : (data.data as Prisma.InputJsonValue);

  const artifact = await prisma.artifact.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      specificationId,
      type: data.type,
      title: data.title,
      status: data.status,
      data: jsonData,
      error: data.error ?? null,
    },
    update: {
      status: data.status,
      data: jsonData,
      error: data.error ?? null,
    },
  });

  // Update specification's updatedAt
  await prisma.specification.update({
    where: { id: specificationId },
    data: { updatedAt: new Date() },
  });

  return {
    id: artifact.id,
    type: artifact.type as ArtifactType,
    title: artifact.title,
    status: artifact.status as ArtifactStatus,
    data: artifact.data as Record<string, unknown> | null,
    error: artifact.error ?? undefined,
    createdAt: artifact.createdAt.toISOString(),
  };
}

// Delete an artifact
export async function deleteArtifact(id: string): Promise<void> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership via artifact -> spec -> project
  const artifact = await prisma.artifact.findUnique({
    where: { id },
    include: { specification: { include: { project: true } } }
  });

  if (!artifact || !artifact.specification || !artifact.specification.project) {
    throw new Error("Artifact not found");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    artifact.specification.project.userId === userId ||
    (orgId && artifact.specification.project.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  await prisma.artifact.delete({
    where: { id },
  });
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// These allow existing code to continue working while we migrate to new names
// ============================================================================

// Legacy function: Get all specifications across all projects/features
// This is for the dashboard that doesn't know about the hierarchy yet
async function getAllInterviewsLegacy(): Promise<SpecificationData[]> {
  const { userId, orgId } = await auth();

  // If no user, return empty list
  if (!userId) return [];

  // Build the where clause based on whether user is in an organization or not
  let whereClause = {};
  if (orgId) {
    // User is in an organization context - show organization specs
    whereClause = { project: { organizationId: orgId } };
  } else {
    // User is in personal context - show personal specs (no org)
    whereClause = { project: { userId, organizationId: null } };
  }

  const specifications = await prisma.specification.findMany({
    where: whereClause,
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return specifications.map((spec) => ({
    id: spec.id,
    projectId: spec.projectId,
    featureId: spec.featureId,
    name: spec.name,
    initialDescription: spec.initialDescription,
    specificationType: spec.specificationType,
    status: spec.status as SpecificationStatus,
    messages: spec.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: spec.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: spec.extractedKnowledge as object | null,
    order: spec.order,
    createdAt: spec.createdAt.toISOString(),
    updatedAt: spec.updatedAt.toISOString(),
  }));
}

// Interview creation now requires a featureId - no auto-creation of projects/features
export async function createInterviewWithFeature(data: {
  id: string;
  featureId: string;
  title: string;
  initialDescription: string;
  status?: SpecificationStatus;
}): Promise<SpecificationData> {
  return createSpecification({
    id: data.id,
    featureId: data.featureId,
    name: data.title,
    initialDescription: data.initialDescription,
    status: data.status,
  });
}

export type InterviewData = SpecificationData;
export type InterviewStatus = SpecificationStatus;

// For hooks/components still using old names
export const getInterview = getSpecification;
export const getAllInterviews = getAllInterviewsLegacy; // Use legacy version for now
export const createInterview = createInterviewWithFeature; // Requires featureId
export const updateInterview = updateSpecification;
export const deleteInterview = deleteSpecification;

