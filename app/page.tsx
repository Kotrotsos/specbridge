"use client";

import { useRouter } from "next/navigation";
import { Plus, FileText, Clock, FolderOpen, Layers, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useInterviews } from "@/hooks/use-interviews";
import { useProjects } from "@/hooks/use-projects";
import { useAuth, Waitlist } from "@clerk/nextjs";
import { useProgress } from "@/components/ui/progress-bar";

export default function DashboardPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { interviews, isLoading: isLoadingInterviews } = useInterviews();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { start: startProgress } = useProgress();

  const navigateWithProgress = (path: string) => {
    startProgress();
    router.push(path);
  };

  const isLoading = isLoadingInterviews || isLoadingProjects;
  const hasProjects = projects.length > 0;

  // Calculate stats
  const totalFeatures = projects.reduce((acc, p) => acc + (p.features?.length || 0), 0);
  const totalInterviews = interviews.length;
  const completedInterviews = interviews.filter(i => i.status === "complete").length;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Waitlist Overlay - shown when not signed in */}
      {isLoaded && !isSignedIn && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="relative z-10 mx-4">
            <Waitlist />
          </div>
        </div>
      )}

      <div className={`mx-auto max-w-4xl px-6 py-12 ${isLoaded && !isSignedIn ? 'blur-sm pointer-events-none select-none' : ''}`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-foreground-secondary">
            Your specification management overview
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
          </div>
        ) : !hasProjects ? (
          /* Empty state - no projects yet */
          <Card className="border-dashed">
            <CardContent className="px-8 py-8">
              <div className="text-center">
                <h2 className="text-lg font-medium text-foreground mb-2">
                  Get Started with SpecBridge
                </h2>
                <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
                  Create your first project to organize your specifications. Projects contain features, and features contain interviews where you capture domain knowledge.
                </p>
                <Button onClick={() => navigateWithProgress("/new/project")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Dashboard with stats and recent activity */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{projects.length}</p>
                      <p className="text-sm text-foreground-secondary">Projects</p>
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                      <Layers className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{totalFeatures}</p>
                      <p className="text-sm text-foreground-secondary">Features</p>
                    </div>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-green-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{completedInterviews}/{totalInterviews}</p>
                      <p className="text-sm text-foreground-secondary">Interviews</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Interviews */}
            <div>
              <h2 className="mb-4 text-lg font-medium text-foreground">
                Recent Interviews
              </h2>

              {interviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-foreground-secondary">
                      No interviews yet. Navigate to a feature in the sidebar to start your first interview.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {interviews.slice(0, 5).map((interview) => {
                    const questionCount = interview.messages.filter(
                      (m) => m.role === "assistant"
                    ).length;
                    return (
                      <Card
                        key={interview.id}
                        className="cursor-pointer transition-all hover:border-foreground-muted hover:shadow-sm"
                        onClick={() => navigateWithProgress(`/interview/${interview.id}`)}
                      >
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 text-foreground-muted" />
                            <div>
                              <CardTitle className="text-base">
                                {interview.name || "Untitled Specification"}
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
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${interview.status === "complete"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {interview.status === "complete" ? "Complete" : "In Progress"}
                          </span>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
