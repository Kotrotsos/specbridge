"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DBInterview,
  getAllInterviews,
  deleteInterview as dbDeleteInterview,
} from "@/lib/db";

interface UseInterviewsReturn {
  interviews: DBInterview[];
  isLoading: boolean;
  error: Error | null;
  deleteInterview: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing the list of all interviews
 */
export function useInterviews(): UseInterviewsReturn {
  const [interviews, setInterviews] = useState<DBInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadInterviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllInterviews();
      setInterviews(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load interviews")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const deleteInterview = useCallback(
    async (id: string) => {
      try {
        await dbDeleteInterview(id);
        setInterviews((prev) => prev.filter((i) => i.id !== id));
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete interview")
        );
      }
    },
    []
  );

  return {
    interviews,
    isLoading,
    error,
    deleteInterview,
    refresh: loadInterviews,
  };
}
