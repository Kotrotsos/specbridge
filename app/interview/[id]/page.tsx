"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  FileText,
  GitBranch,
  Scale,
  Variable,
  AlertTriangle,
  Loader2,
  Check,
  ChevronLeft,
  Trash2,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  X,
  Pencil,
} from "lucide-react";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { ChatContainer, Message } from "@/components/chat/chat-container";
import { useInterview } from "@/hooks/use-interview";
import { ArtifactType, ArtifactData } from "@/app/actions/specifications";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import clsx from "clsx";

interface InterviewPageProps {
  params: { id: string };
}

// Artifact type configuration
const ARTIFACT_TYPES: {
  type: ArtifactType;
  label: string;
  icon: typeof FileText;
  color: string;
  description: string;
}[] = [
    {
      type: "overview",
      label: "Overview",
      icon: FileText,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Process summary and steps",
    },
    {
      type: "decision-tree",
      label: "Visualize Diagram",
      icon: GitBranch,
      color: "bg-green-50 text-green-700 border-green-200",
      description: "Visual flowchart",
    },
    {
      type: "rules",
      label: "Rules",
      icon: Scale,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      description: "Business rules",
    },
    {
      type: "variables",
      label: "Variables",
      icon: Variable,
      color: "bg-orange-50 text-orange-700 border-orange-200",
      description: "Data and constraints",
    },
    {
      type: "edge-cases",
      label: "Edge Cases",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700 border-red-200",
      description: "Exceptions and edge cases",
    },
  ];

export default function InterviewPage({ params }: InterviewPageProps) {
  const {
    interview,
    isLoading: isLoadingInterview,
    addMessage,
    setInitialDescription,
    setTitle,
    addArtifact,
    updateArtifact,
    deleteArtifact,
  } = useInterview({ id: params.id });

  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const generatingRef = useRef<Set<string>>(new Set());

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  // Settings modal state
  const [settingsModalType, setSettingsModalType] = useState<ArtifactType | null>(null);
  const [diagramType, setDiagramType] = useState<"flowchart" | "sequence">("flowchart");

  // Convert DB messages to UI messages
  const messages: Message[] = useMemo(() => {
    if (!interview) return [];
    return interview.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
  }, [interview]);

  const hasMessages = messages.length > 0;
  const artifacts = interview?.artifacts || [];
  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId);
  const title = interview?.name || "New Interview";

  // Build breadcrumb items from hierarchy
  const breadcrumbItems = useMemo(() => {
    if (!interview?.feature) return [];
    return [
      { label: interview.feature.project.name, href: `/project/${interview.feature.project.id}` },
      { label: interview.feature.name, href: `/feature/${interview.feature.id}` },
      { label: title },
    ];
  }, [interview?.feature, title]);

  // Handle title edit
  const startEditingTitle = useCallback(() => {
    setEditingTitleValue(title);
    setIsEditingTitle(true);
  }, [title]);

  const saveTitle = useCallback(async () => {
    if (!editingTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    await setTitle(editingTitleValue.trim());
    setIsEditingTitle(false);
  }, [editingTitleValue, setTitle]);

  // Get the timestamp of the last message to check if artifacts are outdated
  const lastMessageTime = useMemo(() => {
    if (!interview?.messages.length) return null;
    const lastMsg = interview.messages[interview.messages.length - 1];
    return new Date(lastMsg.timestamp).getTime();
  }, [interview?.messages]);

  // Check if an artifact is outdated (created before the last message)
  const isArtifactOutdated = useCallback(
    (artifact: ArtifactData) => {
      if (!lastMessageTime) return false;
      const artifactTime = new Date(artifact.createdAt).getTime();
      return artifactTime < lastMessageTime;
    },
    [lastMessageTime]
  );

  // Ask a question from an edge case (adds it as an assistant message)
  const askQuestion = useCallback(
    async (question: string) => {
      await addMessage({
        role: "assistant",
        content: question,
      });
      // Go back to list view so user can see the chat
      setSelectedArtifactId(null);
    },
    [addMessage]
  );

  // Handle artifact deletion
  const handleDeleteArtifact = useCallback(
    async (artifactId: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent opening the artifact
      if (selectedArtifactId === artifactId) {
        setSelectedArtifactId(null);
      }
      await deleteArtifact(artifactId);
    },
    [deleteArtifact, selectedArtifactId]
  );

  // Generate an artifact
  const generateArtifact = useCallback(
    async (type: ArtifactType, settings?: { diagramType?: "flowchart" | "sequence" }) => {
      if (!interview || interview.messages.length === 0) return;

      const typeConfig = ARTIFACT_TYPES.find((t) => t.type === type);
      if (!typeConfig) return;

      // Create artifact in generating state with settings info
      const label = type === "decision-tree" && settings?.diagramType === "sequence"
        ? "Sequence Diagram"
        : typeConfig.label;
      const artifact = await addArtifact(type, label);
      generatingRef.current.add(artifact.id);

      try {
        const apiMessages = interview.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            initialDescription: interview.initialDescription,
            action: "extract",
            artifactType: type,
            settings,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate artifact");
        }

        const data = await response.json();

        await updateArtifact(artifact.id, {
          status: "complete",
          data: data.knowledge,
        });
      } catch (error) {
        console.error("Error generating artifact:", error);
        await updateArtifact(artifact.id, {
          status: "error",
          error: error instanceof Error ? error.message : "Generation failed",
        });
      } finally {
        generatingRef.current.delete(artifact.id);
      }
    },
    [interview, addArtifact, updateArtifact]
  );

  // Regenerate an outdated artifact
  const handleRegenerateArtifact = useCallback(
    async (artifact: ArtifactData, e?: React.MouseEvent) => {
      e?.stopPropagation();
      // Delete old artifact
      if (selectedArtifactId === artifact.id) {
        setSelectedArtifactId(null);
      }
      await deleteArtifact(artifact.id);
      // Generate new one
      await generateArtifact(artifact.type);
    },
    [deleteArtifact, generateArtifact, selectedArtifactId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!interview) return;

      const isFirstMessage = interview.messages.length === 0;

      if (isFirstMessage) {
        await setInitialDescription(content);
      }

      await addMessage({
        role: "user",
        content,
      });

      setInputValue("");
      setIsSending(true);

      try {
        const apiMessages = [
          ...interview.messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content },
        ];

        const description = isFirstMessage ? content : interview.initialDescription;

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            initialDescription: description,
            action: "chat",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const data = await response.json();

        await addMessage({
          role: "assistant",
          content: data.message,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        await addMessage({
          role: "assistant",
          content: "Sorry, there was an error processing your response. Please try again.",
        });
      } finally {
        setIsSending(false);
      }
    },
    [interview, addMessage, setInitialDescription]
  );

  // Handle generate with settings
  const handleGenerateWithSettings = useCallback(() => {
    if (!settingsModalType) return;
    const settings = settingsModalType === "decision-tree" ? { diagramType } : undefined;
    generateArtifact(settingsModalType, settings);
    setSettingsModalType(null);
  }, [settingsModalType, diagramType, generateArtifact]);

  if (isLoadingInterview) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
      </div>
    );
  }

  // Chat panel
  const chatPanel = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-3">
        {/* Breadcrumbs */}
        {breadcrumbItems.length > 0 && (
          <div className="mb-2">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}
        {/* Editable Title */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
              className="flex-1 text-lg font-medium text-foreground bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0.5"
              autoFocus
            />
          ) : (
            <h1
              onClick={startEditingTitle}
              className="text-lg font-medium text-foreground cursor-pointer hover:text-blue-600 flex items-center gap-2 group"
            >
              {title}
              <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
            </h1>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isSending}
          initialDescription={interview?.initialDescription || ""}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
      </div>
    </div>
  );

  // Studio panel - list view
  const studioListView = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium text-foreground">Studio</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* Artifact type grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {ARTIFACT_TYPES.map((artifactType) => {
            const Icon = artifactType.icon;
            const isDisabled = !hasMessages;
            const hasSettings = artifactType.type === "decision-tree";
            return (
              <div key={artifactType.type} className="relative group/card">
                <button
                  onClick={() => generateArtifact(artifactType.type)}
                  disabled={isDisabled}
                  className={clsx(
                    "flex flex-col items-start gap-1 rounded-[8px] border p-3 text-left transition-all w-full",
                    artifactType.color,
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-sm hover:scale-[1.02]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{artifactType.label}</span>
                </button>
                {hasSettings && !isDisabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettingsModalType(artifactType.type);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-[4px] bg-white/80 opacity-0 group-hover/card:opacity-100 hover:bg-white transition-all"
                    title="Configure settings"
                  >
                    <Settings className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Artifacts list */}
        {artifacts.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wide">
              Generated
            </h3>
            <div className="space-y-2">
              {artifacts.map((artifact) => {
                const outdated = artifact.status === "complete" && isArtifactOutdated(artifact);
                return (
                  <div
                    key={artifact.id}
                    onClick={() => artifact.status === "complete" && setSelectedArtifactId(artifact.id)}
                    className={clsx(
                      "flex items-center gap-3 w-full rounded-[8px] border bg-background-card p-3 text-left transition-colors group",
                      artifact.status === "complete" && "hover:bg-background-sidebar cursor-pointer",
                      artifact.status === "generating" && "cursor-default",
                      outdated ? "border-amber-300" : "border-border"
                    )}
                  >
                    {artifact.status === "generating" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                    ) : artifact.status === "complete" ? (
                      outdated ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {artifact.title}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {artifact.status === "generating"
                          ? "Generating..."
                          : artifact.status === "error"
                            ? artifact.error || "Failed"
                            : outdated
                              ? "May be outdated"
                              : new Date(artifact.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {outdated && (
                        <button
                          onClick={(e) => handleRegenerateArtifact(artifact, e)}
                          className="p-1.5 rounded-[6px] text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Regenerate artifact"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteArtifact(artifact.id, e)}
                        className="p-1.5 rounded-[6px] text-foreground-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Delete artifact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasMessages && (
          <div className="text-center text-sm text-foreground-muted mt-8">
            Start a conversation to generate artifacts
          </div>
        )}
      </div>
    </div>
  );

  // Studio panel - detail view
  const studioDetailView = selectedArtifact && (() => {
    const outdated = isArtifactOutdated(selectedArtifact);
    return (
      <div className="flex h-full flex-col">
        <div className="shrink-0 flex items-center gap-2 border-b border-border px-4 py-3">
          <button
            onClick={() => setSelectedArtifactId(null)}
            className="rounded-[6px] p-1 text-foreground-muted hover:bg-background-sidebar hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-medium text-foreground">{selectedArtifact.title}</h2>
        </div>
        {outdated && (
          <div className="shrink-0 flex items-center justify-between bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700">
                New messages added since generation.
              </span>
            </div>
            <button
              onClick={() => handleRegenerateArtifact(selectedArtifact)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <ArtifactContent artifact={selectedArtifact} onAskQuestion={askQuestion} />
        </div>
      </div>
    );
  })();

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-background">
      <PanelGroup orientation="horizontal" id="interview-panels" className="h-full">
        <Panel defaultSize={60} minSize={40} className="h-full">
          {chatPanel}
        </Panel>
        <PanelResizeHandle className="w-1.5 bg-border hover:bg-foreground-muted transition-colors flex items-center justify-center group">
          <div className="w-1 h-8 rounded-full bg-foreground-muted/50 group-hover:bg-foreground-muted transition-colors" />
        </PanelResizeHandle>
        <Panel defaultSize={40} minSize={25} className="h-full">
          {selectedArtifact ? studioDetailView : studioListView}
        </Panel>
      </PanelGroup>

      {/* Settings Modal */}
      {settingsModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSettingsModalType(null)}
          />
          <div className="relative bg-background-card rounded-[12px] shadow-xl border border-border w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-medium text-foreground">
                {settingsModalType === "decision-tree" ? "Diagram Settings" : "Settings"}
              </h3>
              <button
                onClick={() => setSettingsModalType(null)}
                className="p-1 rounded-[6px] text-foreground-muted hover:bg-background-sidebar hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {settingsModalType === "decision-tree" && (
                <div className="space-y-4">
                  <div className="text-sm text-foreground-secondary mb-4">
                    Choose how to visualize the decision flow from your interview.
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-[8px] border border-border hover:bg-background-sidebar cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="diagramType"
                      checked={diagramType === "flowchart"}
                      onChange={() => setDiagramType("flowchart")}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Flowchart</div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        Shows decision points and outcomes as a branching diagram. Best for visualizing conditional logic and different paths.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-[8px] border border-border hover:bg-background-sidebar cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="diagramType"
                      checked={diagramType === "sequence"}
                      onChange={() => setDiagramType("sequence")}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">Sequence Diagram</div>
                      <div className="text-xs text-foreground-muted mt-0.5">
                        Shows interactions between actors over time. Best for visualizing communication flow and handoffs between people or systems.
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-background-sidebar">
              <button
                onClick={() => setSettingsModalType(null)}
                className="px-4 py-2 rounded-[8px] text-sm font-medium text-foreground-secondary hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithSettings}
                className="px-4 py-2 rounded-[8px] text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Artifact content renderer
function ArtifactContent({
  artifact,
  onAskQuestion
}: {
  artifact: ArtifactData;
  onAskQuestion?: (question: string) => void;
}) {
  if (!artifact.data) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No data available
      </div>
    );
  }

  const data = artifact.data;

  switch (artifact.type) {
    case "overview":
      return <OverviewContent data={data} />;
    case "decision-tree":
      return <DecisionTreeContent data={data} />;
    case "rules":
      return <RulesContent data={data} />;
    case "variables":
      return <VariablesContent data={data} />;
    case "edge-cases":
      return <EdgeCasesContent data={data} onAskQuestion={onAskQuestion} />;
    default:
      return (
        <pre className="whitespace-pre-wrap rounded-[8px] bg-background-sidebar p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

// Overview content
function OverviewContent({ data }: { data: Record<string, unknown> }) {
  const overview = data.overview as {
    title?: string;
    summary?: string;
    description?: string; // Legacy support
    trigger?: string;
    outcome?: string;
    scope?: string;
  } | undefined;

  const context = data.context as {
    background?: string;
    stakeholders?: string[];
    frequency?: string;
    dependencies?: string[];
  } | undefined;

  const steps = data.steps as Array<{
    id: number;
    name: string;
    description: string;
    actor?: string;
    effect?: string;
    inputs?: string[];
    outputs?: string[];
    notes?: string;
  }> | undefined;

  const edgeCases = data.edgeCases as Array<{
    scenario: string;
    handling: string;
  }> | undefined;

  const openQuestions = data.openQuestions as Array<{
    question: string;
    impact: string;
  }> | undefined;

  const additionalNotes = data.additionalNotes as string | undefined;

  return (
    <div className="space-y-6">
      {/* Title and Summary */}
      {overview && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-3">{overview.title || "Process Overview"}</h3>
          {(overview.summary || overview.description) && (
            <div className="prose prose-sm max-w-none text-foreground-secondary whitespace-pre-wrap">
              {overview.summary || overview.description}
            </div>
          )}
        </div>
      )}

      {/* Key Info Grid */}
      {overview && (overview.trigger || overview.outcome || overview.scope) && (
        <div className="grid grid-cols-1 gap-3">
          {overview.trigger && (
            <div className="rounded-[8px] border border-border bg-background-card p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">Trigger</div>
              <div className="text-sm text-foreground">{overview.trigger}</div>
            </div>
          )}
          {overview.outcome && (
            <div className="rounded-[8px] border border-border bg-background-card p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">Outcome</div>
              <div className="text-sm text-foreground">{overview.outcome}</div>
            </div>
          )}
          {overview.scope && (
            <div className="rounded-[8px] border border-border bg-background-card p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">Scope</div>
              <div className="text-sm text-foreground">{overview.scope}</div>
            </div>
          )}
        </div>
      )}

      {/* Context */}
      {context && (context.background || context.stakeholders?.length || context.frequency || context.dependencies?.length) && (
        <div className="rounded-[8px] border border-border bg-background-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Context</h4>
          <div className="space-y-3">
            {context.background && (
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-1">Background</div>
                <div className="text-sm text-foreground-secondary">{context.background}</div>
              </div>
            )}
            {context.stakeholders && context.stakeholders.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-1">Stakeholders</div>
                <div className="flex flex-wrap gap-1">
                  {context.stakeholders.map((s, i) => (
                    <span key={i} className="rounded bg-background-sidebar px-2 py-0.5 text-xs text-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {context.frequency && (
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-1">Frequency</div>
                <div className="text-sm text-foreground-secondary">{context.frequency}</div>
              </div>
            )}
            {context.dependencies && context.dependencies.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-1">Dependencies</div>
                <div className="flex flex-wrap gap-1">
                  {context.dependencies.map((d, i) => (
                    <span key={i} className="rounded bg-background-sidebar px-2 py-0.5 text-xs text-foreground">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Process Steps */}
      {steps && steps.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">Process Steps</h4>
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={step.id || idx} className="rounded-[8px] border border-border bg-background-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-medium">
                    {step.id || idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{step.name}</div>
                    {step.actor && (
                      <div className="text-xs text-foreground-muted mt-0.5">Performed by: {step.actor}</div>
                    )}
                    <p className="mt-2 text-sm text-foreground-secondary">{step.description}</p>
                    {step.effect && (
                      <div className="mt-2 rounded-[6px] border-l-2 border-green-500 bg-green-50 px-3 py-2">
                        <div className="text-xs font-medium text-green-800">Effect</div>
                        <div className="text-sm text-green-900">{step.effect}</div>
                      </div>
                    )}
                    {step.notes && (
                      <div className="mt-2 text-xs text-foreground-muted italic">{step.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edge Cases */}
      {edgeCases && edgeCases.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">Edge Cases</h4>
          <div className="space-y-2">
            {edgeCases.map((ec, idx) => (
              <div key={idx} className="rounded-[8px] border border-amber-200 bg-amber-50 p-3">
                <div className="text-sm font-medium text-amber-900">{ec.scenario}</div>
                <div className="text-sm text-amber-800 mt-1">{ec.handling}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Questions */}
      {openQuestions && openQuestions.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-foreground">Open Questions</h4>
          <div className="space-y-2">
            {openQuestions.map((q, idx) => (
              <div key={idx} className="rounded-[8px] border border-blue-200 bg-blue-50 p-3">
                <div className="text-sm font-medium text-blue-900">{q.question}</div>
                <div className="text-xs text-blue-700 mt-1">Impact: {q.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {additionalNotes && (
        <div className="rounded-[8px] border border-border bg-background-sidebar p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Additional Notes</h4>
          <div className="text-sm text-foreground-secondary whitespace-pre-wrap">{additionalNotes}</div>
        </div>
      )}
    </div>
  );
}

// Decision Tree content
function DecisionTreeContent({ data }: { data: Record<string, unknown> }) {
  const tree = data.decisionTree as {
    mermaid?: string;
    description?: string;
  } | undefined;

  if (!tree?.mermaid) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No decision tree data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tree.description && (
        <p className="text-sm text-foreground-secondary">{tree.description}</p>
      )}
      <div className="rounded-[8px] border border-border bg-background-card p-4">
        <MermaidDiagram chart={tree.mermaid} className="flex justify-center" />
      </div>
    </div>
  );
}

// Rules content
function RulesContent({ data }: { data: Record<string, unknown> }) {
  const rules = data.rules as Array<{
    id: string;
    name: string;
    condition: string;
    action: string;
    priority?: number;
    exceptions?: string[];
  }> | undefined;

  if (!rules || rules.length === 0) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No rules extracted
      </div>
    );
  }

  // Strip "IF " or "THEN " prefix if already present
  const stripPrefix = (text: string, prefix: string) => {
    const upper = text.trimStart().toUpperCase();
    if (upper.startsWith(prefix.toUpperCase())) {
      return text.trimStart().slice(prefix.length).trimStart();
    }
    return text;
  };

  return (
    <div className="space-y-3">
      {rules.map((rule, idx) => (
        <div key={rule.id || idx} className="rounded-[8px] border border-border bg-background-card p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{rule.name}</span>
            {rule.priority && (
              <span className="rounded bg-background-sidebar px-2 py-0.5 text-xs text-foreground-muted">
                Priority {rule.priority}
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="font-medium text-foreground-muted">IF:</span>{" "}
              <span className="text-foreground-secondary">{stripPrefix(rule.condition, "IF ")}</span>
            </div>
            <div>
              <span className="font-medium text-foreground-muted">THEN:</span>{" "}
              <span className="text-foreground-secondary">{stripPrefix(rule.action, "THEN ")}</span>
            </div>
          </div>
          {rule.exceptions && rule.exceptions.length > 0 && (
            <div className="mt-2 text-xs text-foreground-muted">
              Exceptions: {rule.exceptions.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Variables content
function VariablesContent({ data }: { data: Record<string, unknown> }) {
  const variables = data.variables as Array<{
    name: string;
    type: string;
    description: string;
    possibleValues?: string[];
    constraints?: string;
  }> | undefined;

  if (!variables || variables.length === 0) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No variables extracted
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {variables.map((variable, idx) => (
        <div key={idx} className="rounded-[8px] border border-border bg-background-card p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{variable.name}</span>
            <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
              {variable.type}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground-secondary">{variable.description}</p>
          {variable.possibleValues && variable.possibleValues.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {variable.possibleValues.map((val, i) => (
                <span key={i} className="rounded bg-background-sidebar px-2 py-0.5 text-xs">
                  {val}
                </span>
              ))}
            </div>
          )}
          {variable.constraints && (
            <div className="mt-2 text-xs text-foreground-muted">
              Constraints: {variable.constraints}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Edge Cases content
function EdgeCasesContent({
  data,
  onAskQuestion
}: {
  data: Record<string, unknown>;
  onAskQuestion?: (question: string) => void;
}) {
  const edgeCases = data.edgeCases as Array<{
    scenario: string;
    handling: string;
  }> | undefined;

  const openQuestions = data.openQuestions as Array<{
    question: string;
    impact: string;
  }> | undefined;

  if ((!edgeCases || edgeCases.length === 0) && (!openQuestions || openQuestions.length === 0)) {
    return (
      <div className="text-sm text-foreground-muted text-center py-8">
        No edge cases identified
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {edgeCases && edgeCases.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Edge Cases</h4>
          {edgeCases.map((edgeCase, idx) => (
            <div key={idx} className="rounded-[8px] border border-border bg-background-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-foreground">{edgeCase.scenario}</div>
                {onAskQuestion && (
                  <button
                    onClick={() => onAskQuestion(`Can you tell me more about this edge case: "${edgeCase.scenario}"? How should we handle it?`)}
                    className="shrink-0 p-1.5 rounded-[6px] text-foreground-muted hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Ask about this in chat"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 rounded-[6px] bg-background-sidebar p-3">
                <div className="text-xs font-medium text-foreground-muted mb-1">Handling</div>
                <div className="text-sm text-foreground">{edgeCase.handling}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {openQuestions && openQuestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Open Questions</h4>
          {openQuestions.map((q, idx) => (
            <div
              key={idx}
              className={clsx(
                "rounded-[8px] border border-border bg-background-card p-4",
                onAskQuestion && "cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              )}
              onClick={() => onAskQuestion?.(q.question)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-foreground">{q.question}</div>
                {onAskQuestion && (
                  <MessageCircle className="h-4 w-4 shrink-0 text-blue-500" />
                )}
              </div>
              <div className="mt-1 text-sm text-foreground-muted">
                Impact: {q.impact}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
