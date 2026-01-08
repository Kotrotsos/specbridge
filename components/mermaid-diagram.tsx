"use client";

import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import DOMPurify from "dompurify";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

// Track if mermaid has been initialized
let mermaidInitialized = false;

// Initialize mermaid with all diagram types pre-registered
async function initializeMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "strict",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis",
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
    },
  });

  mermaidInitialized = true;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const [error, setError] = useState<string | null>(null);
  const [sanitizedSvg, setSanitizedSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);
  const retryCount = useRef(0);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) {
        setError("No chart data provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Initialize mermaid (handles diagram type registration)
        await initializeMermaid();

        // Normalize the chart: convert escaped newlines to actual newlines
        let normalizedChart = chart
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "  ")
          .trim();

        // Auto-fix common syntax errors
        // Fix unclosed decision nodes: {Question? without closing }
        normalizedChart = normalizedChart.replace(
          /(\{[^}]+?)(\s*\n|\s*-->)/g,
          (match, openBrace, suffix) => {
            // Only add closing brace if it's missing
            if (!openBrace.includes("}")) {
              return openBrace + "}" + suffix;
            }
            return match;
          }
        );

        console.log("[Mermaid] Rendering chart:", normalizedChart);

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, normalizedChart);

        // Sanitize the SVG output with DOMPurify
        const cleanSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ["foreignObject"],
        });

        setSanitizedSvg(cleanSvg);
        setError(null);
        retryCount.current = 0;
      } catch (err) {
        console.error("[Mermaid] Render error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to render diagram";

        // Retry on chunk loading errors (up to 3 times)
        if (errorMessage.includes("Loading chunk") && retryCount.current < 3) {
          retryCount.current++;
          console.log(`[Mermaid] Retrying render (attempt ${retryCount.current})...`);
          // Wait a bit and retry
          setTimeout(() => renderChart(), 500 * retryCount.current);
          return;
        }

        setError(errorMessage);
        setSanitizedSvg("");
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart, renderKey]);

  const handleRetry = () => {
    retryCount.current = 0;
    setError(null);
    setSanitizedSvg("");
    setRenderKey((k) => k + 1);
  };

  if (error) {
    return (
      <div className="rounded-[8px] border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-red-800">Diagram Error</div>
          <button
            onClick={handleRetry}
            className="text-xs text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
        <p className="mt-1 text-xs text-red-700">{error}</p>
        <pre className="mt-2 whitespace-pre-wrap rounded bg-red-100 p-2 text-xs text-red-900 overflow-x-auto">
          {chart}
        </pre>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
      </div>
    );
  }

  if (!sanitizedSvg) {
    return (
      <div className="text-sm text-foreground-muted text-center py-4">
        No diagram to display
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
    />
  );
}
