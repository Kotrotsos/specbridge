"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PanelLeft, PanelRight, Pin, PinOff } from "lucide-react";

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  side: "left" | "right";
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey: string;
  title?: string;
}

interface SidebarState {
  width: number;
  collapsed: boolean;
  pinned: boolean;
}

export function CollapsibleSidebar({
  children,
  side,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 480,
  storageKey,
  title,
}: CollapsibleSidebarProps) {
  const [state, setState] = useState<SidebarState>({
    width: defaultWidth,
    collapsed: false,
    pinned: true,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const edgeHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          width: parsed.width ?? defaultWidth,
          collapsed: parsed.collapsed ?? false,
          pinned: parsed.pinned ?? true,
        });
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, [storageKey, defaultWidth]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = state.width;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = side === "left" ? e.clientX - startX : startX - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
      setState(prev => ({ ...prev, width: newWidth }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [state.width, side, minWidth, maxWidth]);

  // Handle hover for unpinned state
  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!state.pinned && !isResizing) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 300);
    }
  }, [state.pinned, isResizing]);

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  // Toggle pin
  const togglePin = useCallback(() => {
    setState(prev => ({ ...prev, pinned: !prev.pinned }));
  }, []);

  // Determine if sidebar should be visible
  const isVisible = state.pinned ? !state.collapsed : (isHovered || isResizing);

  // Handle edge hover for unpinned collapsed sidebar
  const handleEdgeHoverStart = useCallback(() => {
    if (edgeHoverTimeoutRef.current) {
      clearTimeout(edgeHoverTimeoutRef.current);
    }
    // Open after 500ms of hovering at the edge
    edgeHoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 500);
  }, []);

  const handleEdgeHoverEnd = useCallback(() => {
    if (edgeHoverTimeoutRef.current) {
      clearTimeout(edgeHoverTimeoutRef.current);
      edgeHoverTimeoutRef.current = null;
    }
  }, []);

  // Cleanup edge hover timeout on unmount
  useEffect(() => {
    return () => {
      if (edgeHoverTimeoutRef.current) {
        clearTimeout(edgeHoverTimeoutRef.current);
      }
    };
  }, []);

  // Expand sidebar (for both pinned collapsed and unpinned modes)
  const expandSidebar = useCallback(() => {
    if (state.pinned) {
      setState(prev => ({ ...prev, collapsed: false }));
    } else {
      setIsHovered(true);
    }
  }, [state.pinned]);

  // Check if sidebar is in collapsed state (either pinned+collapsed or unpinned+hidden)
  const isCollapsedState = (state.pinned && state.collapsed) || (!state.pinned && !isVisible);

  return (
    <div className="relative h-full flex-shrink-0 flex">
      {/* Collapsed state: show thin bar with expand button */}
      {isCollapsedState && (
        <div
          className={`h-full flex-shrink-0 relative flex items-start pt-4 justify-center
            bg-background border-border
            ${side === "left" ? "border-r" : "border-l"}
          `}
          style={{ width: 32 }}
          onMouseEnter={handleEdgeHoverStart}
          onMouseLeave={handleEdgeHoverEnd}
        >
          <button
            onClick={expandSidebar}
            className="w-6 h-6 flex items-center justify-center
              rounded-md
              hover:bg-foreground/10 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            {side === "left" ? (
              <PanelLeft className="w-4 h-4 text-foreground-muted" />
            ) : (
              <PanelRight className="w-4 h-4 text-foreground-muted" />
            )}
          </button>
        </div>
      )}

      {/* Main sidebar */}
      <div
        ref={sidebarRef}
        className={`h-full bg-background-sidebar border-border flex flex-col transition-all duration-200 ease-out
          ${side === "left" ? "border-r" : "border-l"}
          ${!state.pinned && isVisible ? "absolute top-0 z-50 shadow-xl" : "relative"}
          ${side === "left" ? "left-0" : "right-0"}
          ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none w-0"}
        `}
        style={{
          width: isVisible ? state.width : 0,
          minWidth: isVisible ? minWidth : 0,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header with controls */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
          {title && (
            <span className="text-sm font-medium text-foreground truncate">{title}</span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={togglePin}
              className="p-1.5 rounded-md hover:bg-foreground/10 transition-colors"
              title={state.pinned ? "Unpin sidebar (auto-hide)" : "Pin sidebar"}
            >
              {state.pinned ? (
                <Pin className="w-3.5 h-3.5 text-foreground-muted" />
              ) : (
                <PinOff className="w-3.5 h-3.5 text-foreground-muted" />
              )}
            </button>
            {state.pinned && (
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-md hover:bg-foreground/10 transition-colors"
                title="Collapse sidebar"
              >
                {side === "left" ? (
                  <PanelLeft className="w-3.5 h-3.5 text-foreground-muted" />
                ) : (
                  <PanelRight className="w-3.5 h-3.5 text-foreground-muted" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className={`absolute top-0 ${side === "left" ? "-right-1" : "-left-1"} w-2 h-full
            cursor-col-resize hover:bg-blue-500/30 active:bg-blue-500/50 transition-colors z-10
            ${isResizing ? "bg-blue-500/50" : ""}`}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
}

// Simplified wrapper for the project sidebar specifically
export function ProjectSidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CollapsibleSidebar
      side="left"
      defaultWidth={280}
      minWidth={220}
      maxWidth={400}
      storageKey="specbridge-project-sidebar"
    >
      {children}
    </CollapsibleSidebar>
  );
}

// Wrapper for the artifacts/studio panel
export function ArtifactsPanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CollapsibleSidebar
      side="right"
      defaultWidth={400}
      minWidth={300}
      maxWidth={600}
      storageKey="specbridge-artifacts-panel"
      title="Studio"
    >
      {children}
    </CollapsibleSidebar>
  );
}
