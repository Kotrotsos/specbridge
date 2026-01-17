"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getInterview,
  createInterview,
  updateInterview,
  addMessage as addMessageAction,
  upsertArtifact,
  deleteArtifact as deleteArtifactAction,
  InterviewData,
  MessageData,
  ArtifactData,
  ArtifactType,
  ArtifactStatus,
} from "@/app/actions/specifications";

interface UseInterviewOptions {
  id: string;
  autoCreate?: boolean;
}

interface UseInterviewReturn {
  interview: InterviewData | null;
  isLoading: boolean;
  error: Error | null;
  addMessage: (message: Omit<MessageData, "id" | "timestamp">) => Promise<void>;
  setTitle: (title: string) => Promise<void>;
  setInitialDescription: (description: string) => Promise<void>;
  setComplete: (knowledge: object | null) => Promise<void>;
  addArtifact: (type: ArtifactType, title: string) => Promise<ArtifactData>;
  updateArtifact: (artifactId: string, updates: Partial<{ status: ArtifactStatus; data: Record<string, unknown> | null; error: string }>) => Promise<void>;
  deleteArtifact: (artifactId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing a single interview with PostgreSQL persistence
 */
export function useInterview({
  id,
  autoCreate = true,
}: UseInterviewOptions): UseInterviewReturn {
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a ref to the latest interview for async operations
  const interviewRef = useRef<InterviewData | null>(null);
  useEffect(() => {
    interviewRef.current = interview;
  }, [interview]);

  // Load or create interview
  const loadInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data = await getInterview(id);

      if (!data && autoCreate) {
        // Create new interview
        data = await createInterview({
          id,
          title: "New Interview",
          initialDescription: "",
          status: "in_progress",
        });
      }

      setInterview(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load interview"));
    } finally {
      setIsLoading(false);
    }
  }, [id, autoCreate]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  // Add a message to the interview
  const addMessage = useCallback(
    async (message: Omit<MessageData, "id" | "timestamp">) => {
      if (!interview) return;

      const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const newMessage = await addMessageAction(id, {
        id: messageId,
        role: message.role,
        content: message.content,
      });

      // Optimistically update local state
      setInterview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [interview, id]
  );

  // Set the interview title/name
  const setTitle = useCallback(
    async (title: string) => {
      if (!interview) return;

      const updated = await updateInterview(id, { name: title });
      if (updated) {
        setInterview(updated);
      }
    },
    [interview, id]
  );

  // Set the initial description
  const setInitialDescription = useCallback(
    async (description: string) => {
      if (!interview) return;

      const updated = await updateInterview(id, {
        initialDescription: description,
        // Also update name if it's still the default
        ...(interview.name === "New Interview" ? { name: description } : {}),
      });
      if (updated) {
        setInterview(updated);
      }
    },
    [interview, id]
  );

  // Mark interview as complete with extracted knowledge
  const setComplete = useCallback(
    async (knowledge: object | null) => {
      if (!interview) return;

      const updated = await updateInterview(id, {
        status: "complete",
        extractedKnowledge: knowledge,
      });
      if (updated) {
        setInterview(updated);
      }
    },
    [interview, id]
  );

  // Add a new artifact (starts in generating state)
  const addArtifact = useCallback(
    async (type: ArtifactType, title: string): Promise<ArtifactData> => {
      const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const newArtifact = await upsertArtifact(id, {
        id: artifactId,
        type,
        title,
        status: "generating",
        data: null,
      });

      // Optimistically update local state
      setInterview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          artifacts: [...prev.artifacts, newArtifact],
          updatedAt: new Date().toISOString(),
        };
      });

      return newArtifact;
    },
    [id]
  );

  // Update an existing artifact
  const updateArtifact = useCallback(
    async (artifactId: string, updates: Partial<{ status: ArtifactStatus; data: Record<string, unknown> | null; error: string }>) => {
      // Use ref to get latest interview state (avoids stale closure)
      const currentInterview = interviewRef.current;
      if (!currentInterview) return;

      // Find the existing artifact to get its type and title
      const existingArtifact = currentInterview.artifacts.find((a) => a.id === artifactId);
      if (!existingArtifact) return;

      const updatedArtifact = await upsertArtifact(id, {
        id: artifactId,
        type: existingArtifact.type,
        title: existingArtifact.title,
        status: updates.status ?? existingArtifact.status,
        data: updates.data ?? existingArtifact.data,
        error: updates.error,
      });

      // Update local state
      setInterview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          artifacts: prev.artifacts.map((a) =>
            a.id === artifactId ? updatedArtifact : a
          ),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    [id]
  );

  // Delete an artifact
  const deleteArtifact = useCallback(
    async (artifactId: string) => {
      const currentInterview = interviewRef.current;
      if (!currentInterview) return;

      await deleteArtifactAction(artifactId);

      // Update local state
      setInterview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          artifacts: prev.artifacts.filter((a) => a.id !== artifactId),
          updatedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  return {
    interview,
    isLoading,
    error,
    addMessage,
    setTitle,
    setInitialDescription,
    setComplete,
    addArtifact,
    updateArtifact,
    deleteArtifact,
    refresh: loadInterview,
  };
}
