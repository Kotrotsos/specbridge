import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import {
  buildAgentSystemPrompt,
  buildAnalysisPrompt,
  ANALYSIS_SYSTEM_PROMPT,
} from "@/config/prompts/agent-interview";

function getOpenAI(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { sessionId, token, message } = await request.json();

    // Validate token + session
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
      include: {
        invite: { select: { token: true } },
        agent: true,
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!session || session.invite.token !== token) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.status !== "active") {
      return new Response(JSON.stringify({ error: "Session is not active" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save customer message
    await prisma.agentMessage.create({
      data: {
        sessionId,
        role: "user",
        content: message,
      },
    });

    // Update last activity
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });

    // Build messages for GPT
    const topics = session.agent.topics as Array<{ id: string; name: string; description: string }>;
    const topicsCovered = (session.topicsCovered as Array<{ topicId: string; status: string; confidence: number }>) || [];

    const systemPrompt = buildAgentSystemPrompt({
      name: session.agent.name,
      goal: session.agent.goal,
      topics,
      flexibility: session.agent.flexibility,
      personality: session.agent.personality,
      welcomeMessage: session.agent.welcomeMessage,
      topicsCovered,
    });

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...session.messages.map(m => ({
        role: m.role as "assistant" | "user",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: chatMessages,
            stream: true,
          });

          let fullResponse = "";

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              // Send SSE message event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "message", content })}\n\n`)
              );
            }
          }

          // Check for completion marker
          const isComplete = fullResponse.includes("[ALL_TOPICS_COVERED]");
          const cleanedResponse = fullResponse.replace("[ALL_TOPICS_COVERED]", "").trim();

          // Save AI response
          const aiMessage = await prisma.agentMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: cleanedResponse,
            },
          });

          // Run analysis extraction
          const allMessages = [
            ...session.messages.map(m => `${m.role === "assistant" ? "Agent" : "Customer"}: ${m.content}`),
            `Customer: ${message}`,
            `Agent: ${cleanedResponse}`,
          ].join("\n\n");

          const analysisPrompt = buildAnalysisPrompt(
            { name: session.agent.name, goal: session.agent.goal, topics, flexibility: session.agent.flexibility, personality: session.agent.personality },
            allMessages
          );

          try {
            const analysisResponse = await getOpenAI().chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: analysisPrompt },
              ],
              response_format: { type: "json_object" },
            });

            const analysisText = analysisResponse.choices[0]?.message?.content || "{}";
            const analysis = JSON.parse(analysisText);

            // Update session with analysis
            await prisma.agentSession.update({
              where: { id: sessionId },
              data: {
                analysis: analysis as any,
                topicsCovered: analysis.topicsCovered as any,
                ...(isComplete ? { status: "completed", completedAt: new Date(), summary: cleanedResponse } : {}),
              },
            });

            // Save analysis snapshot on the message
            await prisma.agentMessage.update({
              where: { id: aiMessage.id },
              data: { analysisSnapshot: analysis as any },
            });

            // Send analysis event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "analysis", analysis })}\n\n`)
            );
          } catch (analysisError) {
            console.error("[agent-chat] Analysis extraction failed:", analysisError);
          }

          if (isComplete) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (err) {
          console.error("[agent-chat] Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Failed to generate response" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[agent-chat] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
