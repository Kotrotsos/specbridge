"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface ProgressContextType {
  start: () => void;
  done: () => void;
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    // Return a no-op version if used outside provider (for safety)
    return {
      start: () => {},
      done: () => {},
      isLoading: false,
    };
  }
  return context;
}

function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { done } = useProgress();

  // Complete progress when navigation finishes
  useEffect(() => {
    done();
  }, [pathname, searchParams, done]);

  return null;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const start = useCallback(() => {
    setIsLoading(true);
    setVisible(true);
    setProgress(0);
  }, []);

  const done = useCallback(() => {
    setProgress(100);
    setIsLoading(false);
    // Hide after animation completes
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  // Animate progress while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        if (prev < 30) return prev + 8;
        if (prev < 60) return prev + 4;
        if (prev < 80) return prev + 2;
        if (prev < 90) return prev + 0.5;
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <ProgressContext.Provider value={{ start, done, isLoading }}>
      {visible && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent">
          <div
            className="h-full bg-blue-500 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {children}
    </ProgressContext.Provider>
  );
}
