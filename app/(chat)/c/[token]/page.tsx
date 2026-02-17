"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { validateToken, sendVerificationCode, verifyCode, getSessionMessages } from "@/app/actions/agent-public";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";

type Phase = "loading" | "invalid" | "verify-email" | "verify-code" | "chatting" | "complete";

export default function CustomerChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [phase, setPhase] = useState<Phase>("loading");
  const [agentName, setAgentName] = useState("");
  const [agentGoal, setAgentGoal] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; timestamp: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Validate token on load
  useEffect(() => {
    validateToken(token).then(result => {
      if (!result || !result.valid) {
        setPhase("invalid");
        return;
      }
      setAgentName(result.agentName || "");
      setAgentGoal(result.agentGoal || "");
      setInviteEmail(result.inviteEmail || "");

      if (result.existingSessionId) {
        // Resume existing session
        setSessionId(result.existingSessionId);
        loadMessages(result.existingSessionId);
        setPhase("chatting");
      } else if (result.inviteStatus === "verified") {
        // Already verified but no session, this shouldn't happen normally
        setPhase("verify-email");
      } else {
        setPhase("verify-email");
      }
    });
  }, [token]);

  const loadMessages = async (sid: string) => {
    const data = await getSessionMessages(sid, token);
    if (data) {
      setMessages(data.messages);
      if (data.status === "completed") {
        setPhase("complete");
      }
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      const result = await sendVerificationCode(token, email.trim());
      if (result.success) {
        setPhase("verify-code");
      } else {
        setError(result.error || "Failed to send code");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);
    try {
      const result = await verifyCode(token, code.trim());
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        await loadMessages(result.sessionId);
        setPhase("chatting");
      } else {
        setError(result.error || "Verification failed");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (isStreaming || !sessionId) return;

    // Optimistically add user message
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, token, message }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMsgId = `assistant-${Date.now()}`;

      // Add empty assistant message
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "message") {
              assistantContent += data.content;
              setMessages(prev =>
                prev.map(m => m.id === assistantMsgId ? { ...m, content: assistantContent } : m)
              );
            } else if (data.type === "complete") {
              setPhase("complete");
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, sessionId, token]);

  // Loading
  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
      </div>
    );
  }

  // Invalid token
  if (phase === "invalid") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-medium text-foreground mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-foreground-secondary">
            This invitation link is no longer valid. Please contact the person who sent it.
          </p>
        </div>
      </div>
    );
  }

  // Email verification
  if (phase === "verify-email") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-foreground mb-1">{agentName}</h1>
            <p className="text-sm text-foreground-secondary">{agentGoal}</p>
          </div>
          <form onSubmit={handleSendVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Verify your email to start
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={inviteEmail || "your@email.com"}
                required
                className="w-full rounded-[8px] border border-border bg-background-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isSending}
              className="w-full rounded-[8px] bg-accent text-accent-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Code verification
  if (phase === "verify-code") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-foreground mb-1">Check your email</h1>
            <p className="text-sm text-foreground-secondary">
              We sent a 6-digit code to {email}
            </p>
          </div>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="w-full rounded-[8px] border border-border bg-background-card px-3 py-3 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isSending || code.length < 6}
              className="w-full rounded-[8px] bg-accent text-accent-foreground py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isSending ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setPhase("verify-email"); setCode(""); setError(null); }}
              className="w-full text-sm text-foreground-muted hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Chat / Complete
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h1 className="text-sm font-medium text-foreground">{agentName}</h1>
        <p className="text-xs text-foreground-muted">
          {phase === "complete" ? "Conversation complete" : "Powered by SpecBridge"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            role={msg.role as "assistant" | "user"}
            content={msg.content}
            timestamp={new Date(msg.timestamp)}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {phase === "chatting" && (
        <div className="border-t border-border p-4">
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder="Type your response..."
          />
        </div>
      )}

      {phase === "complete" && (
        <div className="border-t border-border p-6 text-center">
          <p className="text-sm text-foreground">
            Thank you for sharing your requirements. Your responses have been recorded.
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            You can close this window.
          </p>
        </div>
      )}
    </div>
  );
}
