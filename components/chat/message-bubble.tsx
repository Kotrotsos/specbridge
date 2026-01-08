"use client";

import clsx from "clsx";

interface MessageBubbleProps {
  role: "assistant" | "user";
  content: string;
  timestamp?: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={clsx("flex w-full", {
        "justify-start": isAssistant,
        "justify-end": !isAssistant,
      })}
    >
      <div
        className={clsx("max-w-[85%] rounded-[8px] px-4 py-3", {
          "bg-background-sidebar text-foreground": isAssistant,
          "bg-background-card border border-border text-foreground": !isAssistant,
        })}
      >
        {isAssistant && (
          <div className="mb-1 text-xs font-medium text-foreground-muted">
            SpecBridge
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
        {timestamp && (
          <div className="mt-2 text-xs text-foreground-muted">
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
