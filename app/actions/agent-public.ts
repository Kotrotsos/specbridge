"use server";

import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

// Validate an invite token, return public-safe agent info
export async function validateToken(token: string): Promise<{
  valid: boolean;
  agentName?: string;
  agentGoal?: string;
  personality?: string;
  inviteId?: string;
  inviteEmail?: string;
  inviteStatus?: string;
  existingSessionId?: string;
} | null> {
  const invite = await prisma.agentInvite.findUnique({
    where: { token },
    include: {
      agent: {
        select: { name: true, goal: true, personality: true, status: true },
      },
      sessions: {
        where: { status: "active" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!invite) {
    return { valid: false };
  }

  if (invite.status === "revoked" || invite.status === "expired") {
    return { valid: false };
  }

  if (invite.agent.status !== "active") {
    return { valid: false };
  }

  return {
    valid: true,
    agentName: invite.agent.name,
    agentGoal: invite.agent.goal,
    personality: invite.agent.personality,
    inviteId: invite.id,
    inviteEmail: invite.email,
    inviteStatus: invite.status,
    existingSessionId: invite.sessions[0]?.id ?? undefined,
  };
}

// Send verification code to the invite's email
export async function sendVerificationCode(token: string, email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const invite = await prisma.agentInvite.findUnique({
    where: { token },
    include: { agent: { select: { name: true } } },
  });

  if (!invite) {
    return { success: false, error: "Invalid invite" };
  }

  // Check email matches
  if (invite.email.toLowerCase() !== email.toLowerCase().trim()) {
    return { success: false, error: "Email does not match the invitation" };
  }

  if (invite.status === "revoked" || invite.status === "expired") {
    return { success: false, error: "This invitation is no longer valid" };
  }

  // Generate 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.agentInvite.update({
    where: { id: invite.id },
    data: {
      verificationCode: code,
      codeExpiresAt: expiresAt,
    },
  });

  const result = await sendVerificationEmail({
    to: invite.email,
    code,
    agentName: invite.agent.name,
  });

  return result;
}

// Verify the code and mark invite as verified
export async function verifyCode(token: string, code: string): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const invite = await prisma.agentInvite.findUnique({
    where: { token },
    include: {
      agent: {
        select: { id: true, topics: true, name: true, personality: true, welcomeMessage: true },
      },
    },
  });

  if (!invite) {
    return { success: false, error: "Invalid invite" };
  }

  if (!invite.verificationCode || !invite.codeExpiresAt) {
    return { success: false, error: "No verification code sent" };
  }

  if (new Date() > invite.codeExpiresAt) {
    return { success: false, error: "Code has expired. Please request a new one." };
  }

  if (invite.verificationCode !== code) {
    return { success: false, error: "Invalid code" };
  }

  // Mark as verified
  await prisma.agentInvite.update({
    where: { id: invite.id },
    data: {
      status: "verified",
      verifiedAt: new Date(),
      verificationCode: null,
      codeExpiresAt: null,
    },
  });

  // Create session
  const topics = invite.agent.topics as Array<{ id: string; name: string; description: string }>;
  const topicsCovered = topics.map(t => ({
    topicId: t.id,
    status: "not_started",
    confidence: 0,
  }));

  const session = await prisma.agentSession.create({
    data: {
      agentId: invite.agent.id,
      inviteId: invite.id,
      customerEmail: invite.email,
      customerName: invite.name,
      status: "active",
      topicsCovered: topicsCovered as any,
    },
  });

  // Create initial welcome message
  const { buildAgentWelcomeMessage } = await import("@/config/prompts/agent-interview");
  const welcomeMsg = buildAgentWelcomeMessage({
    name: invite.agent.name,
    goal: "",
    topics: topics,
    flexibility: "moderate",
    personality: invite.agent.personality,
    welcomeMessage: invite.agent.welcomeMessage,
  });

  await prisma.agentMessage.create({
    data: {
      sessionId: session.id,
      role: "assistant",
      content: welcomeMsg,
    },
  });

  return { success: true, sessionId: session.id };
}

// Get session messages for public chat
export async function getSessionMessages(
  sessionId: string,
  token: string
): Promise<{
  messages: Array<{ id: string; role: string; content: string; timestamp: string }>;
  status: string;
  agentName: string;
} | null> {
  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      invite: { select: { token: true } },
      agent: { select: { name: true } },
      messages: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!session || session.invite.token !== token) {
    return null;
  }

  return {
    messages: session.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    })),
    status: session.status,
    agentName: session.agent.name,
  };
}
