"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export type MessageRole = "assistant" | "user";
export type ArtifactType = "overview" | "decision-tree" | "rules" | "variables" | "edge-cases";
export type ArtifactStatus = "generating" | "complete" | "error";
export type InterviewStatus = "in_progress" | "complete";

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

export interface InterviewData {
  id: string;
  userId: string | null;
  title: string;
  initialDescription: string;
  status: InterviewStatus;
  messages: MessageData[];
  artifacts: ArtifactData[];
  extractedKnowledge: object | null;
  createdAt: string;
  updatedAt: string;
}

// Get all interviews for current user
export async function getAllInterviews(): Promise<InterviewData[]> {
  const { userId } = await auth();

  const interviews = await prisma.interview.findMany({
    where: userId ? { userId } : {},
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

  return interviews.map((interview) => ({
    id: interview.id,
    userId: interview.userId,
    title: interview.title,
    initialDescription: interview.initialDescription,
    status: interview.status as InterviewStatus,
    messages: interview.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: interview.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: interview.extractedKnowledge as object | null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  }));
}

// Get a single interview by ID
export async function getInterview(id: string): Promise<InterviewData | null> {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!interview) return null;

  return {
    id: interview.id,
    userId: interview.userId,
    title: interview.title,
    initialDescription: interview.initialDescription,
    status: interview.status as InterviewStatus,
    messages: interview.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: interview.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: interview.extractedKnowledge as object | null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

// Create a new interview
export async function createInterview(data: {
  id: string;
  title: string;
  initialDescription: string;
  status?: InterviewStatus;
}): Promise<InterviewData> {
  const { userId } = await auth();

  const interview = await prisma.interview.create({
    data: {
      id: data.id,
      userId: userId ?? null,
      title: data.title,
      initialDescription: data.initialDescription,
      status: data.status ?? "in_progress",
    },
    include: {
      messages: true,
      artifacts: true,
    },
  });

  revalidatePath("/");

  return {
    id: interview.id,
    userId: interview.userId,
    title: interview.title,
    initialDescription: interview.initialDescription,
    status: interview.status as InterviewStatus,
    messages: [],
    artifacts: [],
    extractedKnowledge: null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

// Update interview details
export async function updateInterview(
  id: string,
  data: Partial<{
    title: string;
    initialDescription: string;
    status: InterviewStatus;
    extractedKnowledge: object | null;
  }>
): Promise<InterviewData | null> {
  // Transform data for Prisma (handle null for JSON fields)
  const prismaData: Prisma.InterviewUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.initialDescription !== undefined && { initialDescription: data.initialDescription }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.extractedKnowledge !== undefined && {
      extractedKnowledge: data.extractedKnowledge === null
        ? Prisma.JsonNull
        : data.extractedKnowledge,
    }),
  };

  const interview = await prisma.interview.update({
    where: { id },
    data: prismaData,
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    id: interview.id,
    userId: interview.userId,
    title: interview.title,
    initialDescription: interview.initialDescription,
    status: interview.status as InterviewStatus,
    messages: interview.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    artifacts: interview.artifacts.map((a) => ({
      id: a.id,
      type: a.type as ArtifactType,
      title: a.title,
      status: a.status as ArtifactStatus,
      data: a.data as Record<string, unknown> | null,
      error: a.error ?? undefined,
      createdAt: a.createdAt.toISOString(),
    })),
    extractedKnowledge: interview.extractedKnowledge as object | null,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

// Delete an interview
export async function deleteInterview(id: string): Promise<void> {
  await prisma.interview.delete({
    where: { id },
  });
  revalidatePath("/");
}

// Add a message to an interview
export async function addMessage(
  interviewId: string,
  data: {
    id: string;
    role: MessageRole;
    content: string;
  }
): Promise<MessageData> {
  const message = await prisma.message.create({
    data: {
      id: data.id,
      interviewId,
      role: data.role,
      content: data.content,
    },
  });

  // Update interview's updatedAt
  await prisma.interview.update({
    where: { id: interviewId },
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
  interviewId: string,
  data: {
    id: string;
    type: ArtifactType;
    title: string;
    status: ArtifactStatus;
    data?: Record<string, unknown> | null;
    error?: string;
  }
): Promise<ArtifactData> {
  // Handle null for JSON fields in Prisma
  const jsonData: Prisma.InputJsonValue | typeof Prisma.JsonNull =
    data.data === null || data.data === undefined
      ? Prisma.JsonNull
      : (data.data as Prisma.InputJsonValue);

  const artifact = await prisma.artifact.upsert({
    where: { id: data.id },
    create: {
      id: data.id,
      interviewId,
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

  // Update interview's updatedAt
  await prisma.interview.update({
    where: { id: interviewId },
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
  await prisma.artifact.delete({
    where: { id },
  });
}
