"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tag types for BABOK extracted items
export const BABOK_TAGS = {
  // Phase 1: Context & Stakeholders
  BUSINESS_NEED: "BUSINESS_NEED",
  STAKEHOLDER: "STAKEHOLDER",
  SUCCESS_CRITERION: "SUCCESS_CRITERION",
  IN_SCOPE: "IN_SCOPE",
  OUT_SCOPE: "OUT_SCOPE",
  RISK: "RISK",
  // Phase 2: Current State
  PROCESS_STEP: "PROCESS_STEP",
  ACTOR: "ACTOR",
  PAIN_POINT: "PAIN_POINT",
  WORKAROUND: "WORKAROUND",
  METRIC: "METRIC",
  ROOT_CAUSE: "ROOT_CAUSE",
  // Phase 3: Future State
  FUTURE_STATE: "FUTURE_STATE",
  CAPABILITY: "CAPABILITY",
  CONSTRAINT: "CONSTRAINT",
  PRIORITY: "PRIORITY",
  ASSUMPTION: "ASSUMPTION",
  // Phase 4: Detailed Rules
  RULE: "RULE",
  DECISION: "DECISION",
  CALCULATION: "CALCULATION",
  VALIDATION: "VALIDATION",
  EXCEPTION: "EXCEPTION",
  EXAMPLE: "EXAMPLE",
  // Phase 5: Validation
  CORRECTION: "CORRECTION",
  GAP: "GAP",
  CONFIDENCE: "CONFIDENCE",
  VERIFY_WITH: "VERIFY_WITH",
  SIGNOFF: "SIGNOFF",
} as const;

export type BabokTag = keyof typeof BABOK_TAGS;

export interface ExtractedItemData {
  id: string;
  phaseId: string;
  specificationId: string | null;
  tag: string;
  tagValue: string | null;
  content: string;
  confidence: number;
  sourceMessageId: string | null;
  sourceQuote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExtractedItemInput {
  phaseId: string;
  specificationId?: string;
  tag: string;
  tagValue?: string;
  content: string;
  confidence?: number;
  sourceMessageId?: string;
  sourceQuote?: string;
}

// Create an extracted item
export async function createExtractedItem(
  input: CreateExtractedItemInput
): Promise<ExtractedItemData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access to phase
  const phase = await prisma.phase.findFirst({
    where: {
      id: input.phaseId,
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

  if (!phase) throw new Error("Phase not found");

  const item = await prisma.extractedItem.create({
    data: {
      phaseId: input.phaseId,
      specificationId: input.specificationId,
      tag: input.tag,
      tagValue: input.tagValue,
      content: input.content,
      confidence: input.confidence ?? 1.0,
      sourceMessageId: input.sourceMessageId,
      sourceQuote: input.sourceQuote,
    },
  });

  revalidatePath(`/feature/${phase.featureId}`);

  return {
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Create multiple extracted items at once
export async function createExtractedItems(
  items: CreateExtractedItemInput[]
): Promise<ExtractedItemData[]> {
  if (items.length === 0) return [];

  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access to first phase (assume all same feature)
  const phase = await prisma.phase.findFirst({
    where: {
      id: items[0].phaseId,
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

  if (!phase) throw new Error("Phase not found");

  const created = await prisma.$transaction(
    items.map((input) =>
      prisma.extractedItem.create({
        data: {
          phaseId: input.phaseId,
          specificationId: input.specificationId,
          tag: input.tag,
          tagValue: input.tagValue,
          content: input.content,
          confidence: input.confidence ?? 1.0,
          sourceMessageId: input.sourceMessageId,
          sourceQuote: input.sourceQuote,
        },
      })
    )
  );

  revalidatePath(`/feature/${phase.featureId}`);

  return created.map((item) => ({
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

// Get all extracted items for a phase
export async function getPhaseExtractedItems(
  phaseId: string
): Promise<ExtractedItemData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const items = await prisma.extractedItem.findMany({
    where: {
      phaseId,
      phase: {
        feature: {
          project: {
            OR: [
              { userId, organizationId: null },
              { organizationId: orgId },
            ],
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

// Get all extracted items for a feature (across all phases)
export async function getFeatureExtractedItems(
  featureId: string
): Promise<ExtractedItemData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const items = await prisma.extractedItem.findMany({
    where: {
      phase: {
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
    },
    orderBy: [{ phase: { phaseNumber: "asc" } }, { createdAt: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

// Get extracted items by tag
export async function getExtractedItemsByTag(
  featureId: string,
  tag: string
): Promise<ExtractedItemData[]> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const items = await prisma.extractedItem.findMany({
    where: {
      tag,
      phase: {
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
    },
    orderBy: { createdAt: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

// Update an extracted item
export async function updateExtractedItem(
  itemId: string,
  updates: Partial<{ content: string; confidence: number; tagValue: string }>
): Promise<ExtractedItemData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access
  const existing = await prisma.extractedItem.findFirst({
    where: {
      id: itemId,
      phase: {
        feature: {
          project: {
            OR: [
              { userId, organizationId: null },
              { organizationId: orgId },
            ],
          },
        },
      },
    },
    include: { phase: true },
  });

  if (!existing) throw new Error("Item not found");

  const item = await prisma.extractedItem.update({
    where: { id: itemId },
    data: updates,
  });

  revalidatePath(`/feature/${existing.phase.featureId}`);

  return {
    id: item.id,
    phaseId: item.phaseId,
    specificationId: item.specificationId,
    tag: item.tag,
    tagValue: item.tagValue,
    content: item.content,
    confidence: item.confidence,
    sourceMessageId: item.sourceMessageId,
    sourceQuote: item.sourceQuote,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Delete an extracted item
export async function deleteExtractedItem(itemId: string): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify access
  const existing = await prisma.extractedItem.findFirst({
    where: {
      id: itemId,
      phase: {
        feature: {
          project: {
            OR: [
              { userId, organizationId: null },
              { organizationId: orgId },
            ],
          },
        },
      },
    },
    include: { phase: true },
  });

  if (!existing) throw new Error("Item not found");

  await prisma.extractedItem.delete({ where: { id: itemId } });

  revalidatePath(`/feature/${existing.phase.featureId}`);
}
