"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { StarterPrompts } from "./starter-prompts";
import { AnswerSuggestions } from "./answer-suggestions";

export interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  initialDescription?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export function ChatContainer({
  messages,
  onSendMessage,
  isLoading = false,
  initialDescription,
  inputValue,
  onInputChange,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;
  const lastMessage = messages[messages.length - 1];
  const showSuggestions =
    hasMessages && lastMessage?.role === "assistant" && !isLoading;

  const handleSuggestionSelect = (suggestion: string) => {
    if (onInputChange) {
      onInputChange(suggestion);
    } else {
      onSendMessage(suggestion);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!hasMessages ? (
          <StarterPrompts onSelect={onSendMessage} />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-[8px] bg-background-sidebar px-4 py-3">
                  <div className="mb-1 text-xs font-medium text-foreground-muted">
                    SpecBridge
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted" />
                    <span
                      className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <span
                      className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && (
              <div className="pl-4">
                <AnswerSuggestions
                  question={lastMessage.content}
                  context={initialDescription}
                  onSelect={handleSuggestionSelect}
                  disabled={isLoading}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            onSend={onSendMessage}
            disabled={isLoading}
            placeholder={
              hasMessages ? "Type your answer..." : "Describe your process..."
            }
            value={inputValue}
            onChange={onInputChange}
          />
        </div>
      </div>
    </div>
  );
}
