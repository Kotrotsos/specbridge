"use client";

import { useStarterPrompts } from "@/hooks/use-starter-prompts";

interface StarterPromptsProps {
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ onSelect }: StarterPromptsProps) {
  const { prompts, isLoading } = useStarterPrompts();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      <h2 className="mb-2 text-xl font-medium text-foreground">
        What would you like to document?
      </h2>
      <p className="mb-6 text-sm text-foreground-secondary">
        Select an example or describe your own process below
      </p>

      <div className="flex w-full max-w-md flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
          </div>
        ) : (
          prompts.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onSelect(prompt.title)}
              className="group w-full rounded-[8px] border border-border bg-background-card p-4 text-left transition-all hover:border-foreground-muted hover:shadow-sm"
            >
              <div className="font-medium text-foreground group-hover:text-foreground">
                {prompt.title}
              </div>
              <div className="mt-1 text-sm text-foreground-secondary">
                {prompt.description}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mt-6 text-sm text-foreground-muted">
        Or describe your own process below...
      </div>
    </div>
  );
}
