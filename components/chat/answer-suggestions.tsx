"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

interface AnswerSuggestionsProps {
  question: string;
  context?: string;
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

const STORAGE_KEY = "bridgespec-suggestions-enabled";

export function AnswerSuggestions({
  question,
  context,
  onSelect,
  disabled = false,
}: AnswerSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setEnabled(stored === "true");
    }
  }, []);

  // Save preference to localStorage
  const toggleEnabled = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  useEffect(() => {
    if (!question || !enabled) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "suggestions",
            messages: [{ role: "assistant", content: question }],
            initialDescription: context,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        setError("Could not load suggestions");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [question, context, enabled]);

  // Show toggle to re-enable when disabled
  if (!enabled) {
    return (
      <button
        onClick={toggleEnabled}
        className="text-xs text-foreground-muted/60 hover:text-foreground-muted transition-colors"
      >
        Show suggestions
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground-muted/60">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-foreground-muted/40" />
        Loading suggestions...
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-muted">
          Example answers:
        </span>
        <button
          onClick={toggleEnabled}
          className="text-xs text-foreground-muted/70 hover:text-foreground-muted transition-colors"
        >
          Hide
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className={clsx(
              "rounded-[6px] border border-border bg-background px-2.5 py-1.5",
              "text-left text-xs text-foreground-secondary",
              "transition-all hover:border-foreground-muted hover:text-foreground hover:bg-background-card",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
