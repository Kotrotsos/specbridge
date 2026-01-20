"use client";

import { useState, useEffect } from "react";
import { Sparkles, FileText, ArrowRight } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
  delay: number; // ms before this message appears
}

interface Artifact {
  name: string;
  status: "pending" | "generating" | "complete";
  delay: number; // ms before status changes to this
}

interface UseCase {
  id: string;
  title: string;
  subtitle: string;
  messages: Message[];
  artifacts: Artifact[];
}

const USE_CASES: UseCase[] = [
  {
    id: "discount",
    title: "Pricing Rules",
    subtitle: "Discount approval workflow",
    messages: [
      { role: "assistant", content: "What happens when a discount request exceeds the maximum allowed percentage?", delay: 500 },
      { role: "user", content: "It goes to a manager for approval. They can either approve it or suggest a lower discount.", delay: 2500 },
      { role: "assistant", content: "What is the maximum percentage a manager can approve without escalating further?", delay: 5000 },
      { role: "user", content: "Managers can approve up to 25%. Anything above that needs director approval.", delay: 7500 },
    ],
    artifacts: [
      { name: "Process Overview", status: "complete", delay: 3000 },
      { name: "Decision Flowchart", status: "complete", delay: 5500 },
      { name: "Business Rules", status: "generating", delay: 7000 },
      { name: "Edge Cases", status: "pending", delay: 0 },
    ],
  },
  {
    id: "onboarding",
    title: "User Onboarding",
    subtitle: "New customer setup flow",
    messages: [
      { role: "assistant", content: "Walk me through what happens when a new customer signs up.", delay: 500 },
      { role: "user", content: "First they verify their email, then complete their profile with company details.", delay: 2500 },
      { role: "assistant", content: "What information is required vs optional in the profile?", delay: 5000 },
      { role: "user", content: "Company name and size are required. Industry and website are optional but help with recommendations.", delay: 7500 },
    ],
    artifacts: [
      { name: "Onboarding Flow", status: "complete", delay: 3000 },
      { name: "Data Requirements", status: "complete", delay: 5500 },
      { name: "Validation Rules", status: "generating", delay: 7000 },
      { name: "Edge Cases", status: "pending", delay: 0 },
    ],
  },
  {
    id: "refund",
    title: "Refund Policy",
    subtitle: "Return and refund logic",
    messages: [
      { role: "assistant", content: "How do you determine if a customer is eligible for a refund?", delay: 500 },
      { role: "user", content: "They need to request within 30 days and the product must be unused or defective.", delay: 2500 },
      { role: "assistant", content: "What happens if the product is partially used but defective?", delay: 5000 },
      { role: "user", content: "Defective items always get full refund regardless of usage. We also cover return shipping.", delay: 7500 },
    ],
    artifacts: [
      { name: "Refund Criteria", status: "complete", delay: 3000 },
      { name: "Decision Tree", status: "complete", delay: 5500 },
      { name: "Exception Rules", status: "generating", delay: 7000 },
      { name: "Test Scenarios", status: "pending", delay: 0 },
    ],
  },
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function ChatMessage({ role, content, isTyping }: { role: "assistant" | "user"; content: string; isTyping?: boolean }) {
  if (role === "assistant") {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-foreground-secondary" />
        </div>
        <div className="bg-background-sidebar rounded-2xl rounded-tl-sm max-w-[85%]">
          {isTyping ? <TypingIndicator /> : <p className="text-sm text-foreground px-4 py-3">{content}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-end">
      <div className="bg-foreground text-background rounded-2xl rounded-tr-sm max-w-[85%]">
        {isTyping ? <TypingIndicator /> : <p className="text-sm px-4 py-3">{content}</p>}
      </div>
      <div className="w-8 h-8 rounded-full bg-foreground/10 flex-shrink-0" />
    </div>
  );
}

function ArtifactItem({ name, status }: { name: string; status: "pending" | "generating" | "complete" }) {
  return (
    <div className="bg-background rounded-xl p-4 border border-border flex items-center gap-3">
      <FileText className="w-4 h-4 text-foreground-secondary" />
      <span className="flex-1 text-sm text-foreground">{name}</span>
      <span
        className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${
          status === "complete"
            ? "bg-green-100 text-green-700"
            : status === "generating"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-foreground/5 text-foreground-muted"
        }`}
      >
        {status === "complete" ? "Ready" : status === "generating" ? "Generating..." : "Pending"}
      </span>
    </div>
  );
}

export function AnimatedDemo() {
  const [activeCase, setActiveCase] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingRole, setTypingRole] = useState<"assistant" | "user">("assistant");
  const [artifactStatuses, setArtifactStatuses] = useState<Record<string, "pending" | "generating" | "complete">>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentCase = USE_CASES[activeCase];

  // Reset and start animation when use case changes
  useEffect(() => {
    setVisibleMessages(0);
    setIsTyping(false);
    setArtifactStatuses({});

    const messages = currentCase.messages;
    const artifacts = currentCase.artifacts;

    // Schedule message appearances
    const messageTimeouts: NodeJS.Timeout[] = [];

    messages.forEach((msg, index) => {
      // Show typing indicator before message
      const typingTimeout = setTimeout(() => {
        setIsTyping(true);
        setTypingRole(msg.role);
      }, msg.delay - 800);
      messageTimeouts.push(typingTimeout);

      // Show actual message
      const msgTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(index + 1);
      }, msg.delay);
      messageTimeouts.push(msgTimeout);
    });

    // Schedule artifact status changes
    const artifactTimeouts: NodeJS.Timeout[] = [];

    artifacts.forEach((artifact) => {
      if (artifact.delay > 0) {
        const timeout = setTimeout(() => {
          setArtifactStatuses(prev => ({ ...prev, [artifact.name]: artifact.status }));
        }, artifact.delay);
        artifactTimeouts.push(timeout);
      }
    });

    // Cycle to next use case
    const cycleTimeout = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveCase((prev) => (prev + 1) % USE_CASES.length);
        setIsTransitioning(false);
      }, 300);
    }, 10000);

    return () => {
      messageTimeouts.forEach(clearTimeout);
      artifactTimeouts.forEach(clearTimeout);
      clearTimeout(cycleTimeout);
    };
  }, [activeCase, currentCase]);

  return (
    <div className="space-y-6">
      {/* Use case tabs */}
      <div className="flex justify-center gap-2">
        {USE_CASES.map((useCase, index) => (
          <button
            key={useCase.id}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setActiveCase(index);
                setIsTransitioning(false);
              }, 300);
            }}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              activeCase === index
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-foreground-secondary hover:bg-foreground/10"
            }`}
          >
            {useCase.title}
          </button>
        ))}
      </div>

      {/* Demo window */}
      <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <div className="bg-background-card rounded-2xl border border-border shadow-2xl shadow-foreground/10 overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-background-sidebar border-b border-border px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-foreground/20" />
              <div className="w-3 h-3 rounded-full bg-foreground/20" />
              <div className="w-3 h-3 rounded-full bg-foreground/20" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-background rounded-lg px-4 py-1 text-xs text-foreground-muted">
                specbridge.ai/interview
              </div>
            </div>
          </div>

          {/* Interface mockup */}
          <div className="flex h-[420px]">
            {/* Chat panel */}
            <div className="flex-1 border-r border-border p-6 flex flex-col">
              <div className="text-sm text-foreground-muted mb-4">
                Interview Chat
                <span className="ml-2 text-xs text-foreground-muted/60">
                  {currentCase.subtitle}
                </span>
              </div>
              <div className="flex-1 space-y-4 overflow-hidden">
                {currentCase.messages.slice(0, visibleMessages).map((msg, index) => (
                  <ChatMessage key={index} role={msg.role} content={msg.content} />
                ))}
                {isTyping && <ChatMessage role={typingRole} content="" isTyping />}
              </div>
              <div className="mt-4 bg-background-sidebar rounded-xl p-3 flex items-center gap-2">
                <div className="flex-1 text-sm text-foreground-muted">Type your response...</div>
                <ArrowRight className="w-4 h-4 text-foreground-muted" />
              </div>
            </div>

            {/* Artifacts panel */}
            <div className="w-[45%] bg-background-sidebar/50 p-6">
              <div className="text-sm text-foreground-muted mb-4">Generated Artifacts</div>
              <div className="space-y-3">
                {currentCase.artifacts.map((artifact) => (
                  <ArtifactItem
                    key={artifact.name}
                    name={artifact.name}
                    status={artifactStatuses[artifact.name] || "pending"}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {USE_CASES.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              activeCase === index ? "bg-foreground w-6" : "bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
