"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAgent, AgentTopic } from "@/app/actions/agents";
import { useProgress } from "@/components/ui/progress-bar";
import crypto from "crypto";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function NewAgentPage() {
  const router = useRouter();
  const { start: startProgress } = useProgress();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [flexibility, setFlexibility] = useState("moderate");
  const [personality, setPersonality] = useState("professional");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [topics, setTopics] = useState<AgentTopic[]>([
    { id: generateId(), name: "", description: "" },
  ]);

  const addTopic = () => {
    setTopics([...topics, { id: generateId(), name: "", description: "" }]);
  };

  const removeTopic = (index: number) => {
    if (topics.length <= 1) return;
    setTopics(topics.filter((_, i) => i !== index));
  };

  const updateTopic = (index: number, field: "name" | "description", value: string) => {
    const updated = [...topics];
    updated[index] = { ...updated[index], [field]: value };
    setTopics(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Agent name is required"); return; }
    if (!goal.trim()) { setError("Goal is required"); return; }

    const validTopics = topics.filter(t => t.name.trim());
    if (validTopics.length === 0) { setError("At least one topic is required"); return; }

    setIsSubmitting(true);
    try {
      const agent = await createAgent({
        name: name.trim(),
        goal: goal.trim(),
        topics: validTopics.map(t => ({
          id: t.id,
          name: t.name.trim(),
          description: t.description.trim(),
        })),
        flexibility,
        personality,
        welcomeMessage: welcomeMessage.trim() || undefined,
      });
      startProgress();
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(String(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          onClick={() => { startProgress(); router.push("/agents"); }}
          className="flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </button>

        <h1 className="text-2xl font-medium text-foreground mb-8">
          Create Requirements Agent
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-[8px] px-4 py-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Product Requirements for Mobile App"
              className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Goal
            </label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Describe what this agent should achieve. e.g., Understand the customer's needs for a new mobile banking app, focusing on user experience and core features."
              rows={3}
              className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Required Topics
            </label>
            <p className="text-xs text-foreground-muted mb-3">
              The agent will ensure all topics are covered during the conversation.
            </p>
            <div className="space-y-3">
              {topics.map((topic, i) => (
                <Card key={topic.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={topic.name}
                          onChange={e => updateTopic(i, "name", e.target.value)}
                          placeholder={`Topic ${i + 1} name`}
                          className="w-full rounded-[8px] border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <textarea
                          value={topic.description}
                          onChange={e => updateTopic(i, "description", e.target.value)}
                          placeholder="What should the agent ask about this topic?"
                          rows={2}
                          className="w-full rounded-[8px] border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                      </div>
                      {topics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTopic(i)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <button
              type="button"
              onClick={addTopic}
              className="mt-3 flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Topic
            </button>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Flexibility
              </label>
              <select
                value={flexibility}
                onChange={e => setFlexibility(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="strict">Strict (ordered topics)</option>
                <option value="moderate">Moderate (natural flow)</option>
                <option value="flexible">Flexible (organic)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Personality
              </label>
              <select
                value={personality}
                onChange={e => setPersonality(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
              </select>
            </div>
          </div>

          {/* Welcome Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Custom Welcome Message <span className="text-foreground-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={e => setWelcomeMessage(e.target.value)}
              placeholder="Leave blank for an auto-generated greeting based on personality"
              rows={2}
              className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { startProgress(); router.push("/agents"); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
