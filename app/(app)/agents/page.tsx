"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAgents, AgentData } from "@/app/actions/agents";
import { useProgress } from "@/components/ui/progress-bar";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused" },
  archived: { bg: "bg-red-100", text: "text-red-700", label: "Archived" },
};

export default function AgentsPage() {
  const router = useRouter();
  const { start: startProgress } = useProgress();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAgents().then(data => {
      setAgents(data);
      setIsLoading(false);
    });
  }, []);

  const navigate = (path: string) => {
    startProgress();
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-foreground">
              Requirements Agents
            </h1>
            <p className="mt-1 text-foreground-secondary">
              Configure AI agents to gather requirements from your customers
            </p>
          </div>
          <Button onClick={() => navigate("/agents/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2 mb-6 text-sm text-foreground-secondary">
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">Beta</span>
          <span>Send AI-powered requirement gathering agents to your customers via email</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
          </div>
        ) : agents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="px-8 py-8">
              <div className="text-center">
                <Bot className="h-10 w-10 mx-auto mb-4 text-foreground-muted" />
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Create Your First Agent
                </h2>
                <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
                  Set up an AI agent with a goal and required topics, then invite customers to chat with it. The agent gathers requirements and you monitor sessions live.
                </p>
                <Button onClick={() => navigate("/agents/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {agents.map(agent => {
              const status = STATUS_STYLES[agent.status] || STATUS_STYLES.draft;
              return (
                <Card
                  key={agent.id}
                  className="cursor-pointer transition-all hover:border-foreground-muted hover:shadow-sm"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium text-foreground truncate">
                            {agent.name}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-foreground-secondary line-clamp-2 mb-3">
                          {agent.goal}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {agent._count?.invites ?? 0} invites
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {agent._count?.sessions ?? 0} sessions
                          </span>
                          <span>
                            {(agent.topics as any[])?.length ?? 0} topics
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
