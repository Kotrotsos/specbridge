"use client";

import { useState, useEffect, useCallback } from "react";
import { DBStarterPrompt, getStarterPrompts } from "@/lib/db";

interface UseStarterPromptsReturn {
  prompts: DBStarterPrompt[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for loading starter prompts from IndexedDB
 */
export function useStarterPrompts(): UseStarterPromptsReturn {
  const [prompts, setPrompts] = useState<DBStarterPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getStarterPrompts();
      setPrompts(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load starter prompts")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  return {
    prompts,
    isLoading,
    error,
    refresh: loadPrompts,
  };
}
