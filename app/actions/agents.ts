"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/email";
import crypto from "crypto";

// Types

export interface AgentTopic {
  id: string;
  name: string;
  description: string;
}

export interface AgentData {
  id: string;
  userId: string;
  organizationId: string | null;
  name: string;
  goal: string;
  topics: AgentTopic[];
  flexibility: string;
  personality: string;
  welcomeMessage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invites: number;
    sessions: number;
  };
}

export interface InviteData {
  id: string;
  agentId: string;
  email: string;
  name: string | null;
  token: string;
  status: string;
  sentAt: string;
  verifiedAt: string | null;
  _count?: {
    sessions: number;
  };
}

export interface SessionData {
  id: string;
  agentId: string;
  inviteId: string;
  customerEmail: string;
  customerName: string | null;
  status: string;
  topicsCovered: unknown;
  analysis: unknown;
  summary: string | null;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  messageCount?: number;
}

// Agent CRUD

export async function getAgents(): Promise<AgentData[]> {
  const { userId, orgId } = await auth();
  if (!userId) return [];

  const agents = await prisma.requirementsAgent.findMany({
    where: {
      OR: [
        { userId },
        ...(orgId ? [{ organizationId: orgId }] : []),
      ],
    },
    include: {
      _count: {
        select: { invites: true, sessions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return agents.map(a => ({
    id: a.id,
    userId: a.userId,
    organizationId: a.organizationId,
    name: a.name,
    goal: a.goal,
    topics: a.topics as unknown as AgentTopic[],
    flexibility: a.flexibility,
    personality: a.personality,
    welcomeMessage: a.welcomeMessage,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    _count: a._count,
  }));
}

export async function getAgent(id: string): Promise<AgentData | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const agent = await prisma.requirementsAgent.findFirst({
    where: {
      id,
      OR: [
        { userId },
        ...(orgId ? [{ organizationId: orgId }] : []),
      ],
    },
    include: {
      _count: {
        select: { invites: true, sessions: true },
      },
    },
  });

  if (!agent) return null;

  return {
    id: agent.id,
    userId: agent.userId,
    organizationId: agent.organizationId,
    name: agent.name,
    goal: agent.goal,
    topics: agent.topics as unknown as AgentTopic[],
    flexibility: agent.flexibility,
    personality: agent.personality,
    welcomeMessage: agent.welcomeMessage,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    _count: agent._count,
  };
}

export async function createAgent(data: {
  name: string;
  goal: string;
  topics: AgentTopic[];
  flexibility?: string;
  personality?: string;
  welcomeMessage?: string;
}): Promise<AgentData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const agent = await prisma.requirementsAgent.create({
    data: {
      userId,
      organizationId: orgId ?? null,
      name: data.name,
      goal: data.goal,
      topics: data.topics as any,
      flexibility: data.flexibility ?? "moderate",
      personality: data.personality ?? "professional",
      welcomeMessage: data.welcomeMessage ?? null,
      status: "draft",
    },
  });

  revalidatePath("/agents");

  return {
    id: agent.id,
    userId: agent.userId,
    organizationId: agent.organizationId,
    name: agent.name,
    goal: agent.goal,
    topics: agent.topics as unknown as AgentTopic[],
    flexibility: agent.flexibility,
    personality: agent.personality,
    welcomeMessage: agent.welcomeMessage,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  };
}

export async function updateAgent(
  id: string,
  data: Partial<{
    name: string;
    goal: string;
    topics: AgentTopic[];
    flexibility: string;
    personality: string;
    welcomeMessage: string | null;
    status: string;
  }>
): Promise<AgentData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.requirementsAgent.findFirst({
    where: {
      id,
      OR: [{ userId }, ...(orgId ? [{ organizationId: orgId }] : [])],
    },
  });
  if (!existing) throw new Error("Not found");

  const agent = await prisma.requirementsAgent.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.goal !== undefined && { goal: data.goal }),
      ...(data.topics !== undefined && { topics: data.topics as any }),
      ...(data.flexibility !== undefined && { flexibility: data.flexibility }),
      ...(data.personality !== undefined && { personality: data.personality }),
      ...(data.welcomeMessage !== undefined && { welcomeMessage: data.welcomeMessage }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);

  return {
    id: agent.id,
    userId: agent.userId,
    organizationId: agent.organizationId,
    name: agent.name,
    goal: agent.goal,
    topics: agent.topics as unknown as AgentTopic[],
    flexibility: agent.flexibility,
    personality: agent.personality,
    welcomeMessage: agent.welcomeMessage,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  };
}

export async function deleteAgent(id: string): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const existing = await prisma.requirementsAgent.findFirst({
    where: {
      id,
      OR: [{ userId }, ...(orgId ? [{ organizationId: orgId }] : [])],
    },
  });
  if (!existing) throw new Error("Not found");

  await prisma.requirementsAgent.delete({ where: { id } });
  revalidatePath("/agents");
}

// Invites

export async function getAgentInvites(agentId: string): Promise<InviteData[]> {
  const { userId, orgId } = await auth();
  if (!userId) return [];

  // Verify agent access
  const agent = await prisma.requirementsAgent.findFirst({
    where: {
      id: agentId,
      OR: [{ userId }, ...(orgId ? [{ organizationId: orgId }] : [])],
    },
  });
  if (!agent) return [];

  const invites = await prisma.agentInvite.findMany({
    where: { agentId },
    include: {
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invites.map(i => ({
    id: i.id,
    agentId: i.agentId,
    email: i.email,
    name: i.name,
    token: i.token,
    status: i.status,
    sentAt: i.sentAt.toISOString(),
    verifiedAt: i.verifiedAt?.toISOString() ?? null,
    _count: i._count,
  }));
}

export async function createInvite(data: {
  agentId: string;
  email: string;
  name?: string;
}): Promise<InviteData> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const agent = await prisma.requirementsAgent.findFirst({
    where: {
      id: data.agentId,
      OR: [{ userId }, ...(orgId ? [{ organizationId: orgId }] : [])],
    },
  });
  if (!agent) throw new Error("Agent not found");

  const email = data.email.toLowerCase().trim();

  // Check for existing invite, resend if found
  const existing = await prisma.agentInvite.findUnique({
    where: { agentId_email: { agentId: data.agentId, email } },
  });

  let invite;
  if (existing && existing.status !== "revoked") {
    // Re-send existing invite
    invite = existing;
  } else if (existing && existing.status === "revoked") {
    // Reset revoked invite with new token
    const token = crypto.randomBytes(32).toString("hex");
    invite = await prisma.agentInvite.update({
      where: { id: existing.id },
      data: { token, status: "pending", sentAt: new Date() },
    });
  } else {
    const token = crypto.randomBytes(32).toString("hex");
    invite = await prisma.agentInvite.create({
      data: {
        agentId: data.agentId,
        email,
        name: data.name ?? null,
        token,
        status: "pending",
      },
    });
  }

  // Send invite email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://specbridge.ai";
  const inviteUrl = `${baseUrl}/c/${invite.token}`;

  await sendInviteEmail({
    to: invite.email,
    customerName: invite.name ?? data.name ?? undefined,
    agentName: agent.name,
    inviteUrl,
  });

  revalidatePath(`/agents/${data.agentId}`);

  return {
    id: invite.id,
    agentId: invite.agentId,
    email: invite.email,
    name: invite.name,
    token: invite.token,
    status: invite.status,
    sentAt: invite.sentAt.toISOString(),
    verifiedAt: null,
  };
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const invite = await prisma.agentInvite.findUnique({
    where: { id: inviteId },
    include: { agent: true },
  });
  if (!invite) throw new Error("Not found");

  // Verify agent ownership
  const hasAccess =
    invite.agent.userId === userId ||
    (orgId && invite.agent.organizationId === orgId);
  if (!hasAccess) throw new Error("Unauthorized");

  await prisma.agentInvite.update({
    where: { id: inviteId },
    data: { status: "revoked" },
  });

  revalidatePath(`/agents/${invite.agentId}`);
}

// Sessions

export async function getAgentSessions(agentId: string): Promise<SessionData[]> {
  const { userId, orgId } = await auth();
  if (!userId) return [];

  const agent = await prisma.requirementsAgent.findFirst({
    where: {
      id: agentId,
      OR: [{ userId }, ...(orgId ? [{ organizationId: orgId }] : [])],
    },
  });
  if (!agent) return [];

  const sessions = await prisma.agentSession.findMany({
    where: { agentId },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map(s => ({
    id: s.id,
    agentId: s.agentId,
    inviteId: s.inviteId,
    customerEmail: s.customerEmail,
    customerName: s.customerName,
    status: s.status,
    topicsCovered: s.topicsCovered,
    analysis: s.analysis,
    summary: s.summary,
    startedAt: s.startedAt.toISOString(),
    lastActivityAt: s.lastActivityAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    messageCount: s._count.messages,
  }));
}

export async function getSessionDetail(sessionId: string): Promise<{
  session: SessionData;
  messages: Array<{ id: string; role: string; content: string; timestamp: string; analysisSnapshot: unknown }>;
  agent: AgentData;
} | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      agent: true,
      messages: { orderBy: { timestamp: "asc" } },
      _count: { select: { messages: true } },
    },
  });

  if (!session) return null;

  // Verify ownership
  const hasAccess =
    session.agent.userId === userId ||
    (orgId && session.agent.organizationId === orgId);
  if (!hasAccess) return null;

  return {
    session: {
      id: session.id,
      agentId: session.agentId,
      inviteId: session.inviteId,
      customerEmail: session.customerEmail,
      customerName: session.customerName,
      status: session.status,
      topicsCovered: session.topicsCovered,
      analysis: session.analysis,
      summary: session.summary,
      startedAt: session.startedAt.toISOString(),
      lastActivityAt: session.lastActivityAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      messageCount: session._count.messages,
    },
    messages: session.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      analysisSnapshot: m.analysisSnapshot,
    })),
    agent: {
      id: session.agent.id,
      userId: session.agent.userId,
      organizationId: session.agent.organizationId,
      name: session.agent.name,
      goal: session.agent.goal,
      topics: session.agent.topics as unknown as AgentTopic[],
      flexibility: session.agent.flexibility,
      personality: session.agent.personality,
      welcomeMessage: session.agent.welcomeMessage,
      status: session.agent.status,
      createdAt: session.agent.createdAt.toISOString(),
      updatedAt: session.agent.updatedAt.toISOString(),
    },
  };
}
