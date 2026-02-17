import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const { searchParams } = request.nextUrl;
  const after = searchParams.get("after");

  const session = await prisma.agentSession.findUnique({
    where: { id: sessionId },
    include: {
      agent: { select: { userId: true, organizationId: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify ownership
  const hasAccess =
    session.agent.userId === userId ||
    (orgId && session.agent.organizationId === orgId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get messages (optionally after a timestamp)
  const whereClause: any = { sessionId };
  if (after) {
    whereClause.timestamp = { gt: new Date(after) };
  }

  const messages = await prisma.agentMessage.findMany({
    where: whereClause,
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      topicsCovered: session.topicsCovered,
      analysis: session.analysis,
      summary: session.summary,
      lastActivityAt: session.lastActivityAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
    },
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      analysisSnapshot: m.analysisSnapshot,
    })),
  });
}
