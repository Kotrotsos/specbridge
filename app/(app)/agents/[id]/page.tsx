"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Send, Users, MessageSquare, Copy, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAgent,
  getAgentInvites,
  getAgentSessions,
  createInvite,
  revokeInvite,
  updateAgent,
  deleteAgent,
  AgentData,
  InviteData,
  SessionData,
} from "@/app/actions/agents";
import { useProgress } from "@/components/ui/progress-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused" },
  archived: { bg: "bg-red-100", text: "text-red-700", label: "Archived" },
};

const SESSION_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-blue-100", text: "text-blue-700", label: "Active" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  abandoned: { bg: "bg-gray-100", text: "text-gray-700", label: "Abandoned" },
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { start: startProgress } = useProgress();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadData = async () => {
    const [agentData, inviteData, sessionData] = await Promise.all([
      getAgent(id),
      getAgentInvites(id),
      getAgentSessions(id),
    ]);
    setAgent(agentData);
    setInvites(inviteData);
    setSessions(sessionData);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!agent) return;
    await updateAgent(id, { status });
    setAgent({ ...agent, status });
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setIsSendingInvite(true);
    try {
      await createInvite({ agentId: id, email: inviteEmail.trim(), name: inviteName.trim() || undefined });
      setInviteEmail("");
      setInviteName("");
      await loadData();
    } catch (err) {
      setInviteError(String(err));
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    await revokeInvite(inviteId);
    await loadData();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAgent(id);
      startProgress();
      router.push("/agents");
    } catch {
      setIsDeleting(false);
    }
  };

  const copyLink = (token: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/c/${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12 text-center text-foreground-secondary">
        Agent not found
      </div>
    );
  }

  const status = STATUS_STYLES[agent.status] || STATUS_STYLES.draft;
  const topics = agent.topics as Array<{ id: string; name: string; description: string }>;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => { startProgress(); router.push("/agents"); }}
              className="flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium text-foreground">{agent.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-foreground-secondary text-sm">{agent.goal}</p>
          </div>
          <div className="flex items-center gap-2">
            {agent.status === "draft" && (
              <Button onClick={() => handleStatusChange("active")} size="sm">
                Activate
              </Button>
            )}
            {agent.status === "active" && (
              <Button onClick={() => handleStatusChange("paused")} size="sm" variant="outline">
                Pause
              </Button>
            )}
            {agent.status === "paused" && (
              <Button onClick={() => handleStatusChange("active")} size="sm">
                Resume
              </Button>
            )}
            <Button
              onClick={() => { startProgress(); router.push(`/agents/${id}/edit`); }}
              size="sm"
              variant="outline"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              onClick={() => setDeleteDialog(true)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Config Summary */}
        <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
          <Card>
            <div className="p-5">
              <p className="text-xs text-foreground-muted mb-1">Topics</p>
              <p className="text-lg font-semibold">{topics.length}</p>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <p className="text-xs text-foreground-muted mb-1">Flexibility</p>
              <p className="text-sm font-medium capitalize">{agent.flexibility}</p>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <p className="text-xs text-foreground-muted mb-1">Personality</p>
              <p className="text-sm font-medium capitalize">{agent.personality}</p>
            </div>
          </Card>
        </div>

        {/* Topics List */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-medium text-foreground mb-3">Required Topics</h2>
          <div className="space-y-2">
            {topics.map((topic, i) => (
              <div key={topic.id} className="flex items-start gap-3 px-4 py-3 bg-background-sidebar rounded-[8px]">
                <span className="text-xs font-medium text-foreground-muted mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{topic.name}</p>
                  {topic.description && (
                    <p className="text-xs text-foreground-muted mt-0.5">{topic.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Section */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-medium text-foreground mb-3">
            <Users className="h-5 w-5 inline mr-2" />
            Invites
          </h2>

          {agent.status === "active" && (
            <form onSubmit={handleSendInvite} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="flex-1 rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-40 rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button type="submit" size="sm" disabled={isSendingInvite}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {isSendingInvite ? "Sending..." : "Invite"}
                </Button>
              </div>
              {inviteError && (
                <p className="mt-2 text-xs text-red-600">{inviteError}</p>
              )}
            </form>
          )}

          {agent.status !== "active" && (
            <p className="text-sm text-foreground-muted mb-4">
              Activate the agent to send invites.
            </p>
          )}

          {invites.length === 0 ? (
            <p className="text-sm text-foreground-muted">No invites yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between px-4 py-2.5 bg-background-sidebar rounded-[8px]">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-foreground">
                        {invite.email}
                        {invite.name && <span className="text-foreground-muted ml-1">({invite.name})</span>}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Sent {new Date(invite.sentAt).toLocaleDateString()}
                        {invite._count?.sessions ? ` \u00B7 ${invite._count.sessions} session(s)` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      invite.status === "verified" ? "bg-green-100 text-green-700" :
                      invite.status === "revoked" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {invite.status}
                    </span>
                    <button
                      onClick={() => copyLink(invite.token)}
                      className="p-1.5 hover:bg-background rounded"
                      title="Copy invite link"
                    >
                      {copied === invite.token ? (
                        <span className="text-xs text-green-600">Copied</span>
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-foreground-muted" />
                      )}
                    </button>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Revoke invite"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-foreground mb-3">
            <MessageSquare className="h-5 w-5 inline mr-2" />
            Sessions
          </h2>

          {sessions.length === 0 ? (
            <p className="text-sm text-foreground-muted">No sessions yet. Invite customers to start gathering requirements.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => {
                const sessionStatus = SESSION_STATUS_STYLES[session.status] || SESSION_STATUS_STYLES.active;
                return (
                  <Card
                    key={session.id}
                    className="cursor-pointer transition-all hover:border-foreground-muted hover:shadow-sm"
                    onClick={() => { startProgress(); router.push(`/agents/${id}/session/${session.id}`); }}
                  >
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {session.customerEmail}
                            {session.customerName && <span className="text-foreground-muted ml-1">({session.customerName})</span>}
                          </p>
                          <p className="text-xs text-foreground-muted mt-0.5">
                            Started {new Date(session.startedAt).toLocaleDateString()}
                            {" \u00B7 "}
                            {session.messageCount ?? 0} messages
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${sessionStatus.bg} ${sessionStatus.text}`}>
                            {sessionStatus.label}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-foreground-muted" />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Agent?"
        description={`This will permanently delete "${agent.name}" and all its invites and sessions. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
