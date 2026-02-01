"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
    Plus,
    Layers,
    FileText,
    Settings,
    MessageSquare,
    BookOpen,
    X,
    Loader2,
    Download,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    Maximize2,
    GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getProject, ProjectData } from "@/app/actions/projects";
import { getProjectDocument, createProjectDocument, ProjectDocumentData } from "@/app/actions/documents";
import { getMethodology, MethodologyId } from "@/config/methodologies";
import { useProgress } from "@/components/ui/progress-bar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import JSZip from "jszip";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { userId } = useAuth();
    const { start: startProgress } = useProgress();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Document panel state
    const [showDocPanel, setShowDocPanel] = useState(false);
    const [document, setDocument] = useState<ProjectDocumentData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamedContent, setStreamedContent] = useState("");
    const [generationStatus, setGenerationStatus] = useState<string>("");
    const [generationError, setGenerationError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Resizable panel state
    const [panelWidth, setPanelWidth] = useState(50); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const navigateWithProgress = (path: string) => {
        startProgress();
        router.push(path);
    };

    useEffect(() => {
        async function loadProject() {
            try {
                const data = await getProject(id);
                setProject(data);

                // Also load existing document if any
                const doc = await getProjectDocument(id);
                if (doc) {
                    setDocument(doc);
                }
            } catch (error) {
                console.error("Failed to load project:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProject();
    }, [id]);

    // Auto-scroll content during generation
    useEffect(() => {
        if (isGenerating && contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [streamedContent, isGenerating]);

    // Handle panel resizing
    const handleMouseDown = useCallback(() => {
        setIsResizing(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
            setPanelWidth(Math.min(Math.max(newWidth, 20), 80)); // Clamp between 20% and 80%
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    const handleGenerateDocument = async () => {
        if (!project) return;

        setShowDocPanel(true);
        setIsGenerating(true);
        setStreamedContent("");
        setGenerationStatus("Starting...");
        setGenerationError(null);

        try {
            // Create a new document record
            const newDoc = await createProjectDocument(project.id);
            setDocument(newDoc);

            // Start streaming generation
            const response = await fetch("/api/generate-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: project.id,
                    documentId: newDoc.id,
                }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE events
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.startsWith("event: ")) {
                        const eventType = line.slice(7);
                        const dataLine = lines[i + 1];
                        if (dataLine?.startsWith("data: ")) {
                            const data = JSON.parse(dataLine.slice(6));

                            if (eventType === "status") {
                                setGenerationStatus(data.message);
                            } else if (eventType === "content") {
                                setStreamedContent((prev) => prev + data.text);
                            } else if (eventType === "complete") {
                                setGenerationStatus("Complete");
                                // Refresh document from DB
                                const updatedDoc = await getProjectDocument(project.id);
                                if (updatedDoc) {
                                    setDocument(updatedDoc);
                                    setStreamedContent(updatedDoc.content);
                                }
                            } else if (eventType === "error") {
                                setGenerationError(data.message);
                            }
                            i++; // Skip the data line
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Generation error:", error);
            setGenerationError(error instanceof Error ? error.message : "Unknown error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadZip = async () => {
        const content = document?.content || streamedContent;
        if (!content) return;

        const zip = new JSZip();
        let modifiedContent = content;

        // Find all mermaid code blocks and render them as SVGs
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        const matches = [...content.matchAll(mermaidRegex)];

        if (matches.length > 0) {
            // Create images folder
            const imagesFolder = zip.folder("images");

            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const mermaidCode = match[1];
                const imageName = `diagram-${i + 1}.svg`;

                // Get SVG from rendered mermaid diagrams in the DOM (use specific class to avoid icon SVGs)
                const diagramElements = contentRef.current?.querySelectorAll(".mermaid-container .mermaid-svg-content svg");
                if (diagramElements && diagramElements[i]) {
                    const svgElement = diagramElements[i] as SVGElement;
                    const svgContent = new XMLSerializer().serializeToString(svgElement);
                    imagesFolder?.file(imageName, svgContent);

                    // Replace mermaid code block with image reference
                    modifiedContent = modifiedContent.replace(
                        match[0],
                        `![${`Diagram ${i + 1}`}](images/${imageName})`
                    );
                }
            }
        }

        // Add the markdown file
        zip.file("documentation.md", modifiedContent);

        // Generate and download zip
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = `${project?.name || "project"}-documentation.zip`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleOpenFullScreen = () => {
        const content = document?.content || streamedContent;
        if (!content) return;

        // Open document in new window with rendered content
        const newWindow = window.open("", "_blank");
        if (!newWindow) return;

        // Create HTML with the markdown content and mermaid support
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${project?.name || "Project"} - Documentation</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown.min.css">
    <style>
        body {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
        }
        .mermaid {
            display: flex;
            justify-content: center;
            margin: 1rem 0;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body class="markdown-body">
    <div id="content"></div>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        mermaid.initialize({ startOnLoad: false, theme: 'default' });

        const content = ${JSON.stringify(content)};

        // Custom renderer for mermaid
        const renderer = new marked.Renderer();
        const originalCode = renderer.code.bind(renderer);
        renderer.code = function(code, language) {
            if (language === 'mermaid') {
                return '<div class="mermaid">' + code + '</div>';
            }
            return originalCode(code, language);
        };

        document.getElementById('content').innerHTML = marked.parse(content, { renderer });
        mermaid.run();
    </script>
</body>
</html>`;

        newWindow.document.write(html);
        newWindow.document.close();
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-8">
                <p className="text-gray-500">Project not found.</p>
            </div>
        );
    }

    const displayContent = streamedContent || document?.content || "";

    return (
        <div
            ref={containerRef}
            className={`flex h-full ${isResizing ? "select-none" : ""}`}
        >
            {/* Left Panel - Project Overview */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ width: showDocPanel ? `${100 - panelWidth}%` : "100%" }}
            >
                <div className="p-8 max-w-4xl">
                    <Breadcrumb items={[{ label: project.name }]} />

                    <div className="mt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Project</div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                                    {(() => {
                                        const methodology = getMethodology(project.methodology as MethodologyId);
                                        if (!methodology) return null;
                                        return (
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${methodology.color.bg} ${methodology.color.text}`}>
                                                {methodology.name}
                                            </span>
                                        );
                                    })()}
                                </div>
                                {project.description && (
                                    <p className="mt-2 text-gray-600">{project.description}</p>
                                )}
                            </div>

                            {/* Icon actions */}
                            {userId && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowDocPanel(!showDocPanel)}
                                        className={`p-2 rounded-md transition-colors ${
                                            showDocPanel
                                                ? "bg-blue-100 text-blue-600"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                        }`}
                                        title="Documentation"
                                    >
                                        <BookOpen className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => navigateWithProgress(`/project/${project.id}/settings`)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                        title="Settings"
                                    >
                                        <Settings className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => navigateWithProgress(`/new/specification?projectId=${project.id}`)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                        title="New Specification"
                                    >
                                        <FileText className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => navigateWithProgress(`/new/feature/${project.id}`)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                        title="New Feature"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Features</h2>

                            {project.features.length === 0 ? (
                                <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <Layers className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-4 text-sm font-medium text-gray-900">No features yet</h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Get started by adding a feature to organize your specifications.
                                    </p>
                                    {userId && (
                                        <Button
                                            onClick={() => navigateWithProgress(`/new/feature/${project.id}`)}
                                            variant="outline"
                                            className="mt-4"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Feature
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {project.features.map((feature) => (
                                        <div
                                            key={feature.id}
                                            onClick={() => navigateWithProgress(`/feature/${feature.id}`)}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-indigo-100 rounded-lg">
                                                    <Layers className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{feature.name}</h3>
                                                    {feature.description && (
                                                        <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                                                    )}
                                                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                                        <FileText className="h-4 w-4" />
                                                        <span>{feature.specificationCount ?? 0} specifications</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Standalone Specifications */}
                        {project.specifications && project.specifications.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
                                <div className="grid gap-4">
                                    {project.specifications.map((spec) => (
                                        <div
                                            key={spec.id}
                                            onClick={() => navigateWithProgress(`/interview/${spec.id}`)}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <MessageSquare className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{spec.name}</h3>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                                                            spec.status === "complete"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                            {spec.status === "complete" ? "Complete" : "In Progress"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resize Handle */}
            {showDocPanel && (
                <div
                    onMouseDown={handleMouseDown}
                    className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group transition-colors"
                >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-6 w-6 text-gray-400" />
                    </div>
                </div>
            )}

            {/* Right Panel - Documentation */}
            {showDocPanel && (
                <div
                    className="border-l border-gray-200 bg-white flex flex-col h-full"
                    style={{ width: `${panelWidth}%` }}
                >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-gray-600" />
                            <h2 className="font-medium text-gray-900 text-sm">Documentation</h2>
                            {document && (
                                <span className="text-xs text-gray-500">v{document.version}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {displayContent && !isGenerating && (
                                <>
                                    <button
                                        onClick={handleOpenFullScreen}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        title="Open in new window"
                                    >
                                        <Maximize2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={handleDownloadZip}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        title="Download as ZIP"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={handleGenerateDocument}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        title="Regenerate"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setShowDocPanel(false)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto" ref={contentRef}>
                        {!displayContent && !isGenerating && !generationError && (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Generate Project Documentation
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-md">
                                    Create a comprehensive Business Requirements Document by analyzing all your features and specifications.
                                </p>
                                <Button
                                    onClick={handleGenerateDocument}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Generate Documentation
                                </Button>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="p-4 bg-blue-50 border-b border-blue-100">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                    <span className="text-sm text-blue-700">{generationStatus}</span>
                                </div>
                            </div>
                        )}

                        {generationError && (
                            <div className="p-4 bg-red-50 border-b border-red-100">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-sm text-red-700">{generationError}</span>
                                </div>
                            </div>
                        )}

                        {document?.status === "complete" && !isGenerating && (
                            <div className="p-3 bg-green-50 border-b border-green-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-green-700">
                                        Generated {new Date(document.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {displayContent && (
                            <div className="p-6 prose prose-sm max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            const language = match ? match[1] : "";
                                            const codeString = String(children).replace(/\n$/, "");

                                            // Render mermaid diagrams
                                            if (language === "mermaid") {
                                                return (
                                                    <div className="my-4 not-prose mermaid-container">
                                                        <MermaidDiagram chart={codeString} />
                                                    </div>
                                                );
                                            }

                                            // Default code block
                                            return (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                    }}
                                >
                                    {displayContent}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
