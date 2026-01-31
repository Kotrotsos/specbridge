"use client";

import { useEffect, useState, useRef } from "react";
import { renderMermaid } from "beautiful-mermaid";
import DOMPurify from "dompurify";
import { Download, Maximize2 } from "lucide-react";

export type MermaidTheme =
  | "default"
  | "tokyo-night"
  | "catppuccin-mocha"
  | "catppuccin-latte"
  | "nord"
  | "nord-light"
  | "dracula"
  | "github-light"
  | "github-dark"
  | "solarized-light"
  | "solarized-dark";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  theme?: MermaidTheme;
}

// Theme configurations matching beautiful-mermaid
const THEMES: Record<MermaidTheme, { bg: string; fg: string; accent?: string; muted?: string; surface?: string; border?: string }> = {
  default: {
    bg: "#FFFFFF",
    fg: "#1A1A1A",
    accent: "#3B82F6",
    muted: "#666666",
    surface: "#F5F3EE",
    border: "#E5E2DC",
  },
  "tokyo-night": {
    bg: "#1a1b26",
    fg: "#a9b1d6",
    accent: "#7aa2f7",
  },
  "catppuccin-mocha": {
    bg: "#1e1e2e",
    fg: "#cdd6f4",
    accent: "#cba6f7",
  },
  "catppuccin-latte": {
    bg: "#eff1f5",
    fg: "#4c4f69",
    accent: "#8839ef",
  },
  nord: {
    bg: "#2e3440",
    fg: "#eceff4",
    accent: "#88c0d0",
  },
  "nord-light": {
    bg: "#eceff4",
    fg: "#2e3440",
    accent: "#5e81ac",
  },
  dracula: {
    bg: "#282a36",
    fg: "#f8f8f2",
    accent: "#bd93f9",
  },
  "github-light": {
    bg: "#ffffff",
    fg: "#1f2328",
    accent: "#0969da",
  },
  "github-dark": {
    bg: "#0d1117",
    fg: "#e6edf3",
    accent: "#4493f8",
  },
  "solarized-light": {
    bg: "#fdf6e3",
    fg: "#657b83",
    accent: "#268bd2",
  },
  "solarized-dark": {
    bg: "#002b36",
    fg: "#839496",
    accent: "#268bd2",
  },
};

export const THEME_OPTIONS: { value: MermaidTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "github-light", label: "GitHub Light" },
  { value: "github-dark", label: "GitHub Dark" },
  { value: "tokyo-night", label: "Tokyo Night" },
  { value: "dracula", label: "Dracula" },
  { value: "nord", label: "Nord" },
  { value: "nord-light", label: "Nord Light" },
  { value: "catppuccin-mocha", label: "Catppuccin Mocha" },
  { value: "catppuccin-latte", label: "Catppuccin Latte" },
  { value: "solarized-light", label: "Solarized Light" },
  { value: "solarized-dark", label: "Solarized Dark" },
];

export function MermaidDiagram({ chart, className, theme = "default" }: MermaidDiagramProps) {
  const [error, setError] = useState<string | null>(null);
  const [sanitizedSvg, setSanitizedSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0);
  const retryCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const downloadSvg = () => {
    if (!sanitizedSvg) return;
    const blob = new Blob([sanitizedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewWindow = () => {
    if (!sanitizedSvg) return;
    const themeConfig = THEMES[theme];
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Diagram</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: ${themeConfig.bg};
    }
    svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  ${sanitizedSvg}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

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
            if (!openBrace.includes("}")) {
              return openBrace + "}" + suffix;
            }
            return match;
          }
        );

        console.log("[Mermaid] Rendering chart:", normalizedChart);

        // Render with beautiful-mermaid using selected theme
        const themeConfig = THEMES[theme];
        const svg = await renderMermaid(normalizedChart, themeConfig);

        // Sanitize the SVG output with DOMPurify
        const cleanSvg = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
          ADD_TAGS: ["foreignObject", "style"],
        });

        setSanitizedSvg(cleanSvg);
        setError(null);
        retryCount.current = 0;
      } catch (err) {
        console.error("[Mermaid] Render error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to render diagram";

        // Retry on transient errors (up to 3 times)
        if (retryCount.current < 3) {
          retryCount.current++;
          console.log(`[Mermaid] Retrying render (attempt ${retryCount.current})...`);
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
  }, [chart, renderKey, theme]);

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
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={openInNewWindow}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Open in new window"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
        <button
          onClick={downloadSvg}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          title="Download as SVG"
        >
          <Download className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <div
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    </div>
  );
}
