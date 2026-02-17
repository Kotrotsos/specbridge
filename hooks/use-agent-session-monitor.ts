"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface MonitorMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  analysisSnapshot: unknown;
}

interface SessionState {
  id: string;
  status: string;
  topicsCovered: unknown;
  analysis: unknown;
  summary: string | null;
  lastActivityAt: string;
  completedAt: string | null;
}

interface UseAgentSessionMonitorResult {
  messages: MonitorMessage[];
  session: SessionState | null;
  isPolling: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAgentSessionMonitor(sessionId: string): UseAgentSessionMonitorResult {
  const [messages, setMessages] = useState<MonitorMessage[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastTimestamp = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUpdates = useCallback(async (isInitial = false) => {
    try {
      const url = new URL(`/api/agent-session/${sessionId}`, window.location.origin);
      if (!isInitial && lastTimestamp.current) {
        url.searchParams.set("after", lastTimestamp.current);
      }

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      setSession(data.session);

      if (data.messages.length > 0) {
        if (isInitial) {
          setMessages(data.messages);
        } else {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = data.messages.filter((m: MonitorMessage) => !existingIds.has(m.id));
            return newMessages.length > 0 ? [...prev, ...newMessages] : prev;
          });
        }
        // Update timestamp to latest message
        const latest = data.messages[data.messages.length - 1];
        lastTimestamp.current = latest.timestamp;
      }

      // Stop polling if session is completed
      if (data.session.status === "completed" || data.session.status === "abandoned") {
        setIsPolling(false);
      }

      setError(null);
    } catch (err) {
      setError(String(err));
    }
  }, [sessionId]);

  const refresh = useCallback(() => {
    lastTimestamp.current = null;
    fetchUpdates(true);
  }, [fetchUpdates]);

  useEffect(() => {
    // Initial fetch
    fetchUpdates(true);

    // Start polling
    intervalRef.current = setInterval(() => {
      fetchUpdates(false);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUpdates]);

  // Stop interval when polling is disabled
  useEffect(() => {
    if (!isPolling && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isPolling]);

  return { messages, session, isPolling, error, refresh };
}
