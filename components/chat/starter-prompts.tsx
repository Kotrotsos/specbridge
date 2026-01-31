"use client";

interface StarterPromptsProps {
  onSelect: (prompt: string) => void;
  specificationName?: string;
  initialDescription?: string;
}

export function StarterPrompts({
  onSelect,
  specificationName,
  initialDescription,
}: StarterPromptsProps) {
  const name = specificationName?.trim();
  const description = initialDescription?.trim();

  // Generate a contextual first message
  const getStarterMessage = () => {
    if (description && description.length > 10) {
      return description;
    }
    if (name) {
      return `I want to specify the requirements for ${name}`;
    }
    return "I'd like to describe my requirements";
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 max-w-xl mx-auto">
      {name && (
        <div className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
          Specification
        </div>
      )}

      <h2 className="mb-4 text-xl font-medium text-foreground text-center">
        {name || "New Specification"}
      </h2>

      {description && (
        <p className="mb-6 text-sm text-foreground-secondary text-center italic">
          "{description}"
        </p>
      )}

      <div className="text-sm text-foreground-muted text-center mb-8 max-w-md">
        <p className="mb-3">
          Let's capture what you need. Describe the process, feature, or requirement in your own words.
        </p>
        <p className="text-xs">
          You can always refine and add details as we go.
        </p>
      </div>

      <button
        onClick={() => onSelect(getStarterMessage())}
        className="rounded-[8px] bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm text-white font-medium transition-all"
      >
        Start
      </button>
    </div>
  );
}
