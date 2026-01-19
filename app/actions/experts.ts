"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ExpertRole = "domain_expert" | "stakeholder" | "consultant" | "tech_lead";

export interface ProjectExpertData {
  id: string;
  projectId: string;
  email: string;
  name: string;
  role: ExpertRole;
  expertise: string[];
  isActive: boolean;
  invitedAt: string;
}

export interface InviteExpertInput {
  email: string;
  name: string;
  role: ExpertRole;
  expertise?: string[];
}

// Invite an expert to a project
export async function inviteExpert(
  projectId: string,
  input: InviteExpertInput
): Promise<ProjectExpertData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access to project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId, organizationId: null },
        { organizationId: orgId },
      ],
    },
  });

  if (!project) throw new Error("Project not found");

  const expert = await prisma.projectExpert.upsert({
    where: {
      projectId_email: {
        projectId,
        email: input.email,
      },
    },
    update: {
      name: input.name,
      role: input.role,
      expertise: input.expertise ?? [],
      isActive: true,
    },
    create: {
      projectId,
      email: input.email,
      name: input.name,
      role: input.role,
      expertise: input.expertise ?? [],
    },
  });

  revalidatePath(`/project/${projectId}`);

  return {
    id: expert.id,
    projectId: expert.projectId,
    email: expert.email,
    name: expert.name,
    role: expert.role as ExpertRole,
    expertise: expert.expertise,
    isActive: expert.isActive,
    invitedAt: expert.invitedAt.toISOString(),
  };
}

// Get all experts for a project
export async function getProjectExperts(
  projectId: string
): Promise<ProjectExpertData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const experts = await prisma.projectExpert.findMany({
    where: {
      projectId,
      project: {
        OR: [
          { userId, organizationId: null },
          { organizationId: orgId },
        ],
      },
    },
    orderBy: { invitedAt: "desc" },
  });

  return experts.map((expert) => ({
    id: expert.id,
    projectId: expert.projectId,
    email: expert.email,
    name: expert.name,
    role: expert.role as ExpertRole,
    expertise: expert.expertise,
    isActive: expert.isActive,
    invitedAt: expert.invitedAt.toISOString(),
  }));
}

// Update an expert
export async function updateExpert(
  expertId: string,
  updates: Partial<{
    name: string;
    role: ExpertRole;
    expertise: string[];
    isActive: boolean;
  }>
): Promise<ProjectExpertData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access
  const existing = await prisma.projectExpert.findFirst({
    where: {
      id: expertId,
      project: {
        OR: [
          { userId, organizationId: null },
          { organizationId: orgId },
        ],
      },
    },
  });

  if (!existing) throw new Error("Expert not found");

  const expert = await prisma.projectExpert.update({
    where: { id: expertId },
    data: updates,
  });

  revalidatePath(`/project/${expert.projectId}`);

  return {
    id: expert.id,
    projectId: expert.projectId,
    email: expert.email,
    name: expert.name,
    role: expert.role as ExpertRole,
    expertise: expert.expertise,
    isActive: expert.isActive,
    invitedAt: expert.invitedAt.toISOString(),
  };
}

// Remove an expert from a project
export async function removeExpert(expertId: string): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access
  const existing = await prisma.projectExpert.findFirst({
    where: {
      id: expertId,
      project: {
        OR: [
          { userId, organizationId: null },
          { organizationId: orgId },
        ],
      },
    },
  });

  if (!existing) throw new Error("Expert not found");

  await prisma.projectExpert.delete({ where: { id: expertId } });

  revalidatePath(`/project/${existing.projectId}`);
}
