"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useAgentSessionMonitor } from "@/hooks/use-agent-session-monitor";
import { useProgress } from "@/components/ui/progress-bar";

interface TopicCoverage {
  topicId: string;
  topicName?: string;
  status: string;
  confidence: number;
  keyPoints?: string[];
}

interface Requirement {
  id: string;
  description: string;
  topicId?: string;
  priority: string;
  sourceQuote?: string;
}

interface Gap {
  description: string;
  topicId?: string;
  impact?: string;
}

interface Decision {
  description: string;
  rationale?: string;
  sourceQuote?: string;
}

interface Analysis {
  topicsCovered?: TopicCoverage[];
  requirements?: Requirement[];
  decisions?: Decision[];
  gaps?: Gap[];
  overallConfidence?: number;
}

export default function SessionMonitorPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = use(params);
  const router = useRouter();
  const { start: startProgress } = useProgress();
  const { messages, session, isPolling, error } = useAgentSessionMonitor(sessionId);

  const analysis = (session?.analysis as Analysis) || {};
  const topicsCovered = (analysis.topicsCovered || []) as TopicCoverage[];
  const requirements = (analysis.requirements || []) as Requirement[];
  const decisions = (analysis.decisions || []) as Decision[];
  const gaps = (analysis.gaps || []) as Gap[];
  const overallConfidence = analysis.overallConfidence ?? 0;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { startProgress(); router.push(`/agents/${id}`); }}
            className="flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-medium text-foreground">Session Monitor</h1>
            <p className="text-xs text-foreground-muted">
              {session?.status === "completed" ? "Completed" : isPolling ? "Live" : "Disconnected"}
              {error && " (error)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && session?.status === "active" && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                role={msg.role as "assistant" | "user"}
                content={msg.content}
                timestamp={new Date(msg.timestamp)}
              />
            ))}
            {messages.length === 0 && (
              <p className="text-center text-sm text-foreground-muted py-8">
                Waiting for conversation to start...
              </p>
            )}
          </div>
        </div>

        {/* Right: Analysis */}
        <div className="w-96 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Confidence Meter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Overall Confidence</h3>
                <span className="text-sm font-semibold text-foreground">{Math.round(overallConfidence * 100)}%</span>
              </div>
              <div className="h-2 bg-background-sidebar rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(overallConfidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Topics Checklist */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Topics</h3>
              <div className="space-y-2">
                {topicsCovered.length > 0 ? topicsCovered.map((topic) => (
                  <div key={topic.topicId} className="flex items-start gap-2">
                    {topic.confidence >= 0.8 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : topic.confidence > 0 ? (
                      <Circle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground truncate">{topic.topicName || topic.topicId}</p>
                        <span className="text-xs text-foreground-muted ml-2">
                          {Math.round(topic.confidence * 100)}%
                        </span>
                      </div>
                      {topic.keyPoints && topic.keyPoints.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {topic.keyPoints.map((point, i) => (
                            <li key={i} className="text-xs text-foreground-muted">{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-foreground-muted">No analysis yet</p>
                )}
              </div>
            </div>

            {/* Requirements */}
            {requirements.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Requirements ({requirements.length})
                </h3>
                <div className="space-y-2">
                  {requirements.map((req) => (
                    <Card key={req.id}>
                      <CardContent className="p-3">
                        <p className="text-sm text-foreground">{req.description}</p>
                        {req.sourceQuote && (
                          <p className="text-xs text-foreground-muted mt-1 italic">
                            &quot;{req.sourceQuote}&quot;
                          </p>
                        )}
                        <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${
                          req.priority === "high" ? "bg-red-100 text-red-700" :
                          req.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {req.priority}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions */}
            {decisions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Decisions ({decisions.length})
                </h3>
                <div className="space-y-2">
                  {decisions.map((dec, i) => (
                    <div key={i} className="px-3 py-2 bg-background-sidebar rounded-[8px]">
                      <p className="text-sm text-foreground">{dec.description}</p>
                      {dec.rationale && (
                        <p className="text-xs text-foreground-muted mt-1">{dec.rationale}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {gaps.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  <AlertCircle className="h-4 w-4 inline mr-1 text-amber-500" />
                  Gaps ({gaps.length})
                </h3>
                <div className="space-y-2">
                  {gaps.map((gap, i) => (
                    <div key={i} className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-[8px]">
                      <p className="text-sm text-foreground">{gap.description}</p>
                      {gap.impact && (
                        <p className="text-xs text-amber-700 mt-1">{gap.impact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {session?.summary && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Summary</h3>
                <p className="text-sm text-foreground-secondary">{session.summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
