"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface ProjectData {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  features: FeatureData[];
}

export interface SpecificationSummary {
  id: string;
  name: string;
  status: string;
  order: number;
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
}

// Get all projects for current user with their features
export async function getAllProjects(): Promise<ProjectData[]> {
  const { userId } = await auth();

  const projects = await prisma.project.findMany({
    where: userId ? { userId } : {},
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
              order: true,
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
    name: project.name,
    description: project.description,
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
        order: s.order,
      })),
    })),
  }));
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
    name: project.name,
    description: project.description,
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
}): Promise<ProjectData> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get the highest order number for this user
  const maxOrder = await prisma.project.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const project = await prisma.project.create({
    data: {
      userId: userId,
      name: data.name,
      description: data.description ?? null,
      order: (maxOrder?.order ?? -1) + 1,
    },
    include: {
      features: true,
    },
  });

  revalidatePath("/");

  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description,
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
  }>
): Promise<ProjectData | null> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || existingProject.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
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
    name: project.name,
    description: project.description,
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
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check ownership
  const existingProject = await prisma.project.findUnique({ where: { id } });
  if (!existingProject || existingProject.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/");
}

// Reorder projects for current user
export async function reorderProjects(projectIds: string[]): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Update each project's order based on its position in the array
  // Note: ideally we should check ownership of all IDs first, but focusing on simple auth for now
  await Promise.all(
    projectIds.map((id, index) =>
      prisma.project.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    )
  );

  revalidatePath("/");
}
