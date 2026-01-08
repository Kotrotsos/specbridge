"use client";

import { useRouter } from "next/navigation";
import { Plus, FileText, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInterviews } from "@/hooks/use-interviews";

export default function DashboardPage() {
  const router = useRouter();
  const { interviews, isLoading, deleteInterview } = useInterviews();

  const handleNewInterview = () => {
    const newId = Date.now().toString();
    router.push(`/interview/${newId}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this interview?")) {
      await deleteInterview(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-foreground">
            Welcome to BridgeSpec
          </h1>
          <p className="mt-1 text-foreground-secondary">
            Capture and structure domain knowledge through guided interviews
          </p>
        </div>

        {/* New Interview Button */}
        <Button onClick={handleNewInterview} className="mb-8">
          <Plus className="mr-2 h-4 w-4" />
          New Interview
        </Button>

        {/* Past Interviews */}
        <div>
          <h2 className="mb-4 text-lg font-medium text-foreground">
            Recent Interviews
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
            </div>
          ) : interviews.length === 0 ? (
            <Card>
              <CardHeader>
                <CardDescription className="text-center">
                  No interviews yet. Start your first interview to capture domain
                  knowledge.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {interviews.map((interview) => {
                const questionCount = interview.messages.filter(
                  (m) => m.role === "assistant"
                ).length;
                return (
                  <Card
                    key={interview.id}
                    className="cursor-pointer transition-all hover:border-foreground-muted hover:shadow-sm"
                    onClick={() => router.push(`/interview/${interview.id}`)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-foreground-muted" />
                        <div>
                          <CardTitle className="text-base">
                            {interview.title || "Untitled Interview"}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(interview.createdAt).toLocaleDateString()}
                            <span className="text-foreground-muted">
                              {questionCount} questions
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            interview.status === "complete"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {interview.status === "complete" ? "Complete" : "In Progress"}
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, interview.id)}
                          className="rounded-[6px] p-1.5 text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
