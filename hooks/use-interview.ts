"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DBInterview,
  DBMessage,
  DBArtifact,
  ArtifactType,
  getInterview,
  createInterview,
  updateInterview,
} from "@/lib/db";

interface UseInterviewOptions {
  id: string;
  autoCreate?: boolean;
}

interface UseInterviewReturn {
  interview: DBInterview | null;
  isLoading: boolean;
  error: Error | null;
  addMessage: (message: Omit<DBMessage, "id">) => Promise<void>;
  setTitle: (title: string) => Promise<void>;
  setInitialDescription: (description: string) => Promise<void>;
  setComplete: (knowledge: object | null) => Promise<void>;
  addArtifact: (type: ArtifactType, title: string) => Promise<DBArtifact>;
  updateArtifact: (artifactId: string, updates: Partial<DBArtifact>) => Promise<void>;
  deleteArtifact: (artifactId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing a single interview with IndexedDB persistence
 */
export function useInterview({
  id,
  autoCreate = true,
}: UseInterviewOptions): UseInterviewReturn {
  const [interview, setInterview] = useState<DBInterview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a ref to the latest interview for async operations
  const interviewRef = useRef<DBInterview | null>(null);
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
          messages: [],
          artifacts: [],
          extractedKnowledge: null,
        });
      }

      // Migration: ensure artifacts array exists for older interviews
      if (data && !data.artifacts) {
        data = { ...data, artifacts: [] };
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
    async (message: Omit<DBMessage, "id">) => {
      if (!interview) return;

      const newMessage: DBMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };

      const updatedMessages = [...interview.messages, newMessage];

      const updated = await updateInterview(id, {
        messages: updatedMessages,
      });

      if (updated) {
        setInterview(updated);
      }
    },
    [interview, id]
  );

  // Set the interview title
  const setTitle = useCallback(
    async (title: string) => {
      if (!interview) return;

      const updated = await updateInterview(id, { title });
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
        // Also update title if it's still the default
        ...(interview.title === "New Interview" ? { title: description } : {}),
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
    async (type: ArtifactType, title: string): Promise<DBArtifact> => {
      const newArtifact: DBArtifact = {
        id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type,
        title,
        status: "generating",
        data: null,
        createdAt: new Date().toISOString(),
      };

      const currentArtifacts = interview?.artifacts || [];
      const updated = await updateInterview(id, {
        artifacts: [...currentArtifacts, newArtifact],
      });

      if (updated) {
        setInterview(updated);
      }

      return newArtifact;
    },
    [interview, id]
  );

  // Update an existing artifact
  const updateArtifact = useCallback(
    async (artifactId: string, updates: Partial<DBArtifact>) => {
      // Use ref to get latest interview state (avoids stale closure)
      const currentInterview = interviewRef.current;
      if (!currentInterview) return;

      const updatedArtifacts = currentInterview.artifacts.map((a) =>
        a.id === artifactId ? { ...a, ...updates } : a
      );

      const updated = await updateInterview(id, {
        artifacts: updatedArtifacts,
      });

      if (updated) {
        setInterview(updated);
      }
    },
    [id]
  );

  // Delete an artifact
  const deleteArtifact = useCallback(
    async (artifactId: string) => {
      const currentInterview = interviewRef.current;
      if (!currentInterview) return;

      const updatedArtifacts = currentInterview.artifacts.filter(
        (a) => a.id !== artifactId
      );

      const updated = await updateInterview(id, {
        artifacts: updatedArtifacts,
      });

      if (updated) {
        setInterview(updated);
      }
    },
    [id]
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
