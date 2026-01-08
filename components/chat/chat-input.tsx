"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your answer...",
  value: controlledValue,
  onChange: controlledOnChange,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Support both controlled and uncontrolled modes
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledOnChange || setInternalValue;

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset to minimum height first
      textarea.style.height = "24px";
      // Then expand based on content, max 120px
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-[8px] border border-border bg-background-card px-3 py-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={{ height: "24px", minHeight: "24px", maxHeight: "120px" }}
        className={clsx(
          "flex-1 resize-none bg-transparent text-sm leading-6",
          "placeholder:text-foreground-muted",
          "focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        size="sm"
        variant="default"
        className="shrink-0 h-8 w-8 p-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
