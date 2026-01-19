"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Phase names for BABOK workflow
export const BABOK_PHASES = [
  { number: 1, name: "context_stakeholders", label: "Context & Stakeholders", duration: "15 min" },
  { number: 2, name: "current_state", label: "Current State", duration: "20 min" },
  { number: 3, name: "future_state", label: "Future State", duration: "15 min" },
  { number: 4, name: "detailed_rules", label: "Detailed Rules", duration: "30-60 min" },
  { number: 5, name: "validation", label: "Validation & Review", duration: "10-15 min" },
] as const;

export type PhaseNumber = 1 | 2 | 3 | 4 | 5;
export type PhaseName = typeof BABOK_PHASES[number]["name"];
export type PhaseStatus = "not_started" | "in_progress" | "complete";

export interface PhaseData {
  id: string;
  featureId: string;
  phaseNumber: number;
  phaseName: string;
  status: PhaseStatus;
  startedAt: string | null;
  completedAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  specificationCount: number;
  extractedItemCount: number;
}

// Create all 5 phases for a feature (called when feature is created in BABOK project)
export async function createPhasesForFeature(featureId: string): Promise<PhaseData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access to feature
  const feature = await prisma.feature.findFirst({
    where: {
      id: featureId,
      project: {
        OR: [
          { userId, organizationId: null },
          { organizationId: orgId },
        ],
      },
    },
    include: { project: true },
  });

  if (!feature) throw new Error("Feature not found");
  if (feature.project.methodology !== "babok") {
    throw new Error("Phases are only available for BABOK projects");
  }

  // Create all 5 phases
  const phases = await Promise.all(
    BABOK_PHASES.map((phase) =>
      prisma.phase.upsert({
        where: {
          featureId_phaseNumber: {
            featureId,
            phaseNumber: phase.number,
          },
        },
        update: {},
        create: {
          featureId,
          phaseNumber: phase.number,
          phaseName: phase.name,
          status: "not_started",
          order: phase.number,
        },
        include: {
          _count: {
            select: {
              specifications: true,
              extractedItems: true,
            },
          },
        },
      })
    )
  );

  revalidatePath(`/feature/${featureId}`);

  return phases.map((phase) => ({
    id: phase.id,
    featureId: phase.featureId,
    phaseNumber: phase.phaseNumber,
    phaseName: phase.phaseName,
    status: phase.status as PhaseStatus,
    startedAt: phase.startedAt?.toISOString() ?? null,
    completedAt: phase.completedAt?.toISOString() ?? null,
    order: phase.order,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    specificationCount: phase._count.specifications,
    extractedItemCount: phase._count.extractedItems,
  }));
}

// Get all phases for a feature
export async function getFeaturePhases(featureId: string): Promise<PhaseData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const phases = await prisma.phase.findMany({
    where: {
      featureId,
      feature: {
        project: {
          OR: [
            { userId, organizationId: null },
            { organizationId: orgId },
          ],
        },
      },
    },
    orderBy: { phaseNumber: "asc" },
    include: {
      _count: {
        select: {
          specifications: true,
          extractedItems: true,
        },
      },
    },
  });

  return phases.map((phase) => ({
    id: phase.id,
    featureId: phase.featureId,
    phaseNumber: phase.phaseNumber,
    phaseName: phase.phaseName,
    status: phase.status as PhaseStatus,
    startedAt: phase.startedAt?.toISOString() ?? null,
    completedAt: phase.completedAt?.toISOString() ?? null,
    order: phase.order,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    specificationCount: phase._count.specifications,
    extractedItemCount: phase._count.extractedItems,
  }));
}

// Get a single phase by ID
export async function getPhase(phaseId: string): Promise<PhaseData | null> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const phase = await prisma.phase.findFirst({
    where: {
      id: phaseId,
      feature: {
        project: {
          OR: [
            { userId, organizationId: null },
            { organizationId: orgId },
          ],
        },
      },
    },
    include: {
      _count: {
        select: {
          specifications: true,
          extractedItems: true,
        },
      },
    },
  });

  if (!phase) return null;

  return {
    id: phase.id,
    featureId: phase.featureId,
    phaseNumber: phase.phaseNumber,
    phaseName: phase.phaseName,
    status: phase.status as PhaseStatus,
    startedAt: phase.startedAt?.toISOString() ?? null,
    completedAt: phase.completedAt?.toISOString() ?? null,
    order: phase.order,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    specificationCount: phase._count.specifications,
    extractedItemCount: phase._count.extractedItems,
  };
}

// Update phase status
export async function updatePhaseStatus(
  phaseId: string,
  status: PhaseStatus
): Promise<PhaseData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access
  const existing = await prisma.phase.findFirst({
    where: {
      id: phaseId,
      feature: {
        project: {
          OR: [
            { userId, organizationId: null },
            { organizationId: orgId },
          ],
        },
      },
    },
  });

  if (!existing) throw new Error("Phase not found");

  const updateData: { status: string; startedAt?: Date; completedAt?: Date } = { status };

  // Set timestamps based on status
  if (status === "in_progress" && !existing.startedAt) {
    updateData.startedAt = new Date();
  }
  if (status === "complete" && !existing.completedAt) {
    updateData.completedAt = new Date();
  }

  const phase = await prisma.phase.update({
    where: { id: phaseId },
    data: updateData,
    include: {
      _count: {
        select: {
          specifications: true,
          extractedItems: true,
        },
      },
    },
  });

  revalidatePath(`/feature/${phase.featureId}`);

  return {
    id: phase.id,
    featureId: phase.featureId,
    phaseNumber: phase.phaseNumber,
    phaseName: phase.phaseName,
    status: phase.status as PhaseStatus,
    startedAt: phase.startedAt?.toISOString() ?? null,
    completedAt: phase.completedAt?.toISOString() ?? null,
    order: phase.order,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    specificationCount: phase._count.specifications,
    extractedItemCount: phase._count.extractedItems,
  };
}

// Get current active phase for a feature (first non-complete phase)
export async function getCurrentPhase(featureId: string): Promise<PhaseData | null> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const phase = await prisma.phase.findFirst({
    where: {
      featureId,
      status: { not: "complete" },
      feature: {
        project: {
          OR: [
            { userId, organizationId: null },
            { organizationId: orgId },
          ],
        },
      },
    },
    orderBy: { phaseNumber: "asc" },
    include: {
      _count: {
        select: {
          specifications: true,
          extractedItems: true,
        },
      },
    },
  });

  if (!phase) return null;

  return {
    id: phase.id,
    featureId: phase.featureId,
    phaseNumber: phase.phaseNumber,
    phaseName: phase.phaseName,
    status: phase.status as PhaseStatus,
    startedAt: phase.startedAt?.toISOString() ?? null,
    completedAt: phase.completedAt?.toISOString() ?? null,
    order: phase.order,
    createdAt: phase.createdAt.toISOString(),
    updatedAt: phase.updatedAt.toISOString(),
    specificationCount: phase._count.specifications,
    extractedItemCount: phase._count.extractedItems,
  };
}
