"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { BABOK_PHASES } from "@/config/babok-phases";

const FREE_TIER_PROJECT_LIMIT = 3;

export interface ProjectData {
  id: string;
  userId: string | null;
  organizationId: string | null;
  name: string;
  description: string | null;
  methodology: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  features: FeatureData[];
}

export interface SpecificationSummary {
  id: string;
  name: string;
  status: string;
  specificationType: string;
  order: number;
}

export interface PhaseSummary {
  id: string;
  phaseNumber: number;
  phaseName: string;
  status: string;
}

export interface FeatureData {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  specificationCount?: number;
  specifications?: SpecificationSummary[];
  phases?: PhaseSummary[];
}

// Get all projects for current user/organization with their features
export async function getAllProjects(): Promise<ProjectData[]> {
  const { userId, orgId } = await auth();

  // Debug logging for production
  console.log("[getAllProjects] Auth context:", { userId: userId ?? "null", orgId: orgId ?? "null" });

  // If no userId, return empty (not authenticated)
  if (!userId) {
    console.log("[getAllProjects] No userId, returning empty");
    return [];
  }

  // FIXED: Show ALL projects the user owns, regardless of org context
  // Plus any projects in the current org (for team members who didn't create them)
  const whereClause: any = {
    OR: [
      { userId }, // All projects this user created (any org or personal)
      ...(orgId ? [{ organizationId: orgId }] : []), // Plus projects in current org
    ],
  };

  console.log("[getAllProjects] Where clause:", JSON.stringify(whereClause));

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      features: {
        orderBy: { order: "asc" },
        include: {
          specifications: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              status: true,
              specificationType: true,
              order: true,
            },
          },
          phases: {
            orderBy: { phaseNumber: "asc" },
            select: {
              id: true,
              phaseNumber: true,
              phaseName: true,
              status: true,
            },
          },
          _count: {
            select: { specifications: true },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return projects.map((project) => ({
    id: project.id,
    userId: project.userId,
    organizationId: project.organizationId,
    name: project.name,
    description: project.description,
    methodology: project.methodology,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    features: project.features.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      description: f.description,
      order: f.order,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      specificationCount: f._count.specifications,
      specifications: f.specifications.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        specificationType: s.specificationType,
        order: s.order,
      })),
      phases: f.phases.map((p) => ({
        id: p.id,
        phaseNumber: p.phaseNumber,
        phaseName: p.phaseName,
        status: p.status,
      })),
    })),
  }));
}

// Check if user can create more projects (returns limit info)
export interface ProjectLimitInfo {
  canCreate: boolean;
  currentCount: number;
  limit: number | null; // null means unlimited
  isPro: boolean;
}

export async function checkProjectLimit(): Promise<ProjectLimitInfo> {
  const { userId, orgId, has } = await auth();

  if (!userId) {
    return {
      canCreate: false,
      currentCount: 0,
      limit: FREE_TIER_PROJECT_LIMIT,
      isPro: false,
    };
  }

  // Check if user has Pro plan or unlimited_projects feature
  // The feature/plan names should match what you configure in Clerk Dashboard
  const isPro = has?.({ plan: "pro" }) || has?.({ feature: "unlimited_projects" }) || false;

  // Count ALL projects owned by this user (regardless of org context)
  const projectCount = await prisma.project.count({
    where: { userId },
  });

  if (isPro) {
    return {
      canCreate: true,
      currentCount: projectCount,
      limit: null,
      isPro: true,
    };
  }

  return {
    canCreate: projectCount < FREE_TIER_PROJECT_LIMIT,
    currentCount: projectCount,
    limit: FREE_TIER_PROJECT_LIMIT,
    isPro: false,
  };
}

// Get a single project by ID
export async function getProject(id: string): Promise<ProjectData | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      features: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { specifications: true },
          },
        },
      },
    },
  });

  if (!project) return null;

  return {
    id: project.id,
    userId: project.userId,
    organizationId: project.organizationId,
    name: project.name,
    description: project.description,
    methodology: project.methodology,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    features: project.features.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      description: f.description,
      order: f.order,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      specificationCount: f._count.specifications,
    })),
  };
}

// Create a new project
export async function createProject(data: {
  name: string;
  description?: string;
  methodology?: string;
}): Promise<ProjectData> {
  const { userId, orgId, has } = await auth();

  // Debug logging
  console.log("[createProject] Auth context:", { userId: userId ?? "null", orgId: orgId ?? "null" });

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check project limit (server-side enforcement)
  const isPro = has?.({ plan: "pro" }) || has?.({ feature: "unlimited_projects" }) || false;

  if (!isPro) {
    // Count ALL projects owned by this user
    const projectCount = await prisma.project.count({
      where: { userId },
    });

    if (projectCount >= FREE_TIER_PROJECT_LIMIT) {
      throw new Error("Project limit reached. Please upgrade to Pro for unlimited projects.");
    }
  }

  // Get the highest order number for this context (org or personal)
  const maxOrder = await prisma.project.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const project = await prisma.project.create({
    data: {
      userId: userId,
      organizationId: orgId ?? null,
      name: data.name,
      description: data.description ?? null,
      methodology: data.methodology ?? "agile",
      order: (maxOrder?.order ?? -1) + 1,
    },
    include: {
      features: true,
    },
  });

  console.log("[createProject] Created project:", {
    id: project.id,
    userId: project.userId,
    organizationId: project.organizationId
  });

  revalidatePath("/");

  return {
    id: project.id,
    userId: project.userId,
    organizationId: project.organizationId,
    name: project.name,
    description: project.description,
    methodology: project.methodology,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    features: [],
  };
}

// Update a project
export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    methodology: string;
  }>
): Promise<ProjectData | null> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership (must match current context: org or personal)
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject) {
    throw new Error("Unauthorized");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    existingProject.userId === userId ||
    (orgId && existingProject.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.methodology !== undefined && { methodology: data.methodology }),
    },
    include: {
      features: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { specifications: true },
          },
        },
      },
    },
  });

  revalidatePath("/");

  return {
    id: project.id,
    userId: project.userId,
    organizationId: project.organizationId,
    name: project.name,
    description: project.description,
    methodology: project.methodology,
    order: project.order,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    features: project.features.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      description: f.description,
      order: f.order,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      specificationCount: f._count.specifications,
    })),
  };
}

// Delete a project (cascades to features and specifications)
export async function deleteProject(id: string): Promise<void> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject) {
    throw new Error("Unauthorized");
  }

  // Verify access: user owns the project OR is in the project's org
  const hasAccess =
    existingProject.userId === userId ||
    (orgId && existingProject.organizationId === orgId);

  if (!hasAccess) {
    throw new Error("Unauthorized");
  }

  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/");
}

// Reorder projects for current user/organization
export async function reorderProjects(projectIds: string[]): Promise<void> {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Update each project's order based on its position in the array
  // Only update projects that match the current context (org or personal)
  await Promise.all(
    projectIds.map((id, index) =>
      prisma.project.updateMany({
        where: orgId
          ? { id, organizationId: orgId }
          : { id, userId, organizationId: null },
        data: { order: index },
      })
    )
  );

  revalidatePath("/");
}

// Get methodology change impact
export interface MethodologyChangeImpact {
  currentMethodology: string;
  newMethodology: string;
  featureCount: number;
  phasesWithData: number;
  extractedItemsCount: number;
  willCreatePhases: boolean;
  willOrphanPhases: boolean;
}

export async function getMethodologyChangeImpact(
  projectId: string,
  newMethodology: string
): Promise<MethodologyChangeImpact> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId, organizationId: null },
        { organizationId: orgId },
      ],
    },
    include: {
      features: {
        include: {
          phases: {
            include: {
              _count: {
                select: {
                  specifications: true,
                  extractedItems: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) throw new Error("Project not found");

  const featureCount = project.features.length;
  const allPhases = project.features.flatMap((f) => f.phases);
  const phasesWithData = allPhases.filter(
    (p) => p._count.specifications > 0 || p._count.extractedItems > 0 || p.status !== "not_started"
  ).length;
  const extractedItemsCount = allPhases.reduce((acc, p) => acc + p._count.extractedItems, 0);

  return {
    currentMethodology: project.methodology,
    newMethodology,
    featureCount,
    phasesWithData,
    extractedItemsCount,
    willCreatePhases: newMethodology === "babok" && project.methodology !== "babok",
    willOrphanPhases: project.methodology === "babok" && newMethodology !== "babok" && phasesWithData > 0,
  };
}

// Change project methodology with proper handling
export async function changeMethodology(
  projectId: string,
  newMethodology: string
): Promise<ProjectData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId, organizationId: null },
        { organizationId: orgId },
      ],
    },
    include: {
      features: true,
    },
  });

  if (!project) throw new Error("Project not found");

  const oldMethodology = project.methodology;

  // Update methodology
  await prisma.project.update({
    where: { id: projectId },
    data: { methodology: newMethodology },
  });

  // Handle BABOK transition
  if (newMethodology === "babok" && oldMethodology !== "babok") {
    // Create phases for all existing features
    for (const feature of project.features) {
      await prisma.phase.createMany({
        data: BABOK_PHASES.map((phase) => ({
          featureId: feature.id,
          phaseNumber: phase.number,
          phaseName: phase.name,
          status: "not_started",
          order: phase.number,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Note: When switching FROM babok, we keep the phases in DB
  // They just won't be shown in the UI anymore
  // This preserves data in case user switches back

  revalidatePath("/");

  // Return updated project
  const updated = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      features: {
        orderBy: { order: "asc" },
        include: {
          _count: {
            select: { specifications: true },
          },
        },
      },
    },
  });

  if (!updated) throw new Error("Failed to update project");

  return {
    id: updated.id,
    userId: updated.userId,
    organizationId: updated.organizationId,
    name: updated.name,
    description: updated.description,
    methodology: updated.methodology,
    order: updated.order,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    features: updated.features.map((f) => ({
      id: f.id,
      projectId: f.projectId,
      name: f.name,
      description: f.description,
      order: f.order,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      specificationCount: f._count.specifications,
    })),
  };
}
