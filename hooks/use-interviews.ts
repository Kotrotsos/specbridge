"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
  getAllInterviews,
  deleteInterview as deleteInterviewAction,
  InterviewData,
} from "@/app/actions/specifications";

interface UseInterviewsReturn {
  interviews: InterviewData[];
  isLoading: boolean;
  error: Error | null;
  deleteInterview: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing the list of all interviews
 */
export function useInterviews(): UseInterviewsReturn {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useOrganization();

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

  // Re-fetch interviews when organization changes
  useEffect(() => {
    loadInterviews();
  }, [loadInterviews, organization?.id]);

  const deleteInterview = useCallback(
    async (id: string) => {
      try {
        await deleteInterviewAction(id);
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
