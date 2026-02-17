"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, CheckCircle, AlertCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    applyExtractedContent,
    ProjectSourceDocumentData,
    ExtractedFeature,
    ExtractedSpecGroup,
} from "@/app/actions/project-source-documents";

interface ExtractionProgressProps {
    isOpen: boolean;
    onClose: () => void;
    document: ProjectSourceDocumentData;
    onExtractionComplete: () => void;
    onContentApplied: (result: { featuresCreated: number; specificationsCreated: number }) => void;
}

interface ExtractionEvent {
    type: "status" | "feature" | "specification" | "complete" | "error";
    data: unknown;
}

interface StatusData {
    phase: number;
    message: string;
    featureCount?: number;
    currentFeature?: string;
    progress?: number;
    total?: number;
}

interface FeatureData {
    name: string;
    description: string;
    documentContext: string;
}

interface SpecificationData {
    featureName: string;
    specification: {
        name: string;
        initialDescription: string;
        documentContext: string;
    };
}

interface CompleteData {
    featureCount: number;
    specificationCount: number;
    message: string;
}

export function ExtractionProgress({
    isOpen,
    onClose,
    document,
    onExtractionComplete,
    onContentApplied,
}: ExtractionProgressProps) {
    const [status, setStatus] = useState<StatusData | null>(null);
    const [features, setFeatures] = useState<FeatureData[]>([]);
    const [specifications, setSpecifications] = useState<Map<string, SpecificationData["specification"][]>>(new Map());
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Start extraction when modal opens
    useEffect(() => {
        if (!isOpen || document.extractionStatus === "complete") return;

        const startExtraction = async () => {
            try {
                const response = await fetch("/api/extract-features", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ documentId: document.id }),
                });

                if (!response.ok) {
                    throw new Error(await response.text());
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("No response body");
                }

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const event: ExtractionEvent = JSON.parse(line.slice(6));
                                handleEvent(event);
                            } catch (e) {
                                console.error("Failed to parse event:", e);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Extraction error:", err);
                setError(err instanceof Error ? err.message : "Extraction failed");
            }
        };

        startExtraction();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [isOpen, document.id, document.extractionStatus]);

    const handleEvent = useCallback((event: ExtractionEvent) => {
        switch (event.type) {
            case "status":
                setStatus(event.data as StatusData);
                break;
            case "feature":
                setFeatures((prev) => [...prev, event.data as FeatureData]);
                break;
            case "specification": {
                const specData = event.data as SpecificationData;
                setSpecifications((prev) => {
                    const updated = new Map(prev);
                    const existing = updated.get(specData.featureName) || [];
                    updated.set(specData.featureName, [...existing, specData.specification]);
                    return updated;
                });
                break;
            }
            case "complete":
                setIsComplete(true);
                setStatus({
                    phase: 3,
                    message: (event.data as CompleteData).message,
                    featureCount: (event.data as CompleteData).featureCount,
                });
                onExtractionComplete();
                break;
            case "error":
                setError((event.data as { message: string }).message);
                break;
        }
    }, [onExtractionComplete]);

    const handleApply = useCallback(async () => {
        setIsApplying(true);
        try {
            const result = await applyExtractedContent(document.id);
            onContentApplied(result);
            onClose();
        } catch (err) {
            console.error("Apply error:", err);
            setError(err instanceof Error ? err.message : "Failed to apply content");
        } finally {
            setIsApplying(false);
        }
    }, [document.id, onContentApplied, onClose]);

    const handleClose = useCallback(() => {
        if (!isApplying) {
            onClose();
        }
    }, [isApplying, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            window.document.body.style.overflow = "hidden";
        } else {
            window.document.body.style.overflow = "";
        }
        return () => {
            window.document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const totalSpecs = Array.from(specifications.values()).reduce((acc, specs) => acc + specs.length, 0);

    // If extraction is already complete, show the preview
    const showPreview = isComplete || document.extractionStatus === "complete";
    const extractedFeatures = showPreview && document.extractedFeatures
        ? (document.extractedFeatures as ExtractedFeature[])
        : features;
    const extractedSpecs = showPreview && document.extractedSpecs
        ? (document.extractedSpecs as ExtractedSpecGroup[])
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                AI Feature Extraction
                            </h2>
                            <p className="text-sm text-gray-500">
                                {document.fileName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isApplying}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="p-3 rounded-full bg-red-100 mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Extraction Failed
                            </h3>
                            <p className="text-sm text-gray-500 text-center max-w-sm">
                                {error}
                            </p>
                        </div>
                    ) : !showPreview ? (
                        <>
                            {/* Progress indicator */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {status?.message || "Starting extraction..."}
                                        </span>
                                    </div>
                                    {status?.progress && status?.total && (
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 transition-all duration-300"
                                                style={{ width: `${(status.progress / status.total) * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live feature list */}
                            {features.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                                        Features Found ({features.length})
                                    </h3>
                                    {features.map((feature, index) => (
                                        <div
                                            key={index}
                                            className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                <span className="font-medium text-gray-900">
                                                    {feature.name}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 ml-6">
                                                {feature.description}
                                            </p>
                                            {specifications.get(feature.name) && (
                                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                                    {specifications.get(feature.name)?.length} specifications
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Extraction complete - show preview */}
                            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                                <div>
                                    <p className="font-medium text-green-900">
                                        Extraction Complete
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Found {extractedFeatures.length} features and{" "}
                                        {extractedSpecs
                                            ? extractedSpecs.reduce((acc, g) => acc + g.specifications.length, 0)
                                            : totalSpecs}{" "}
                                        specifications
                                    </p>
                                </div>
                            </div>

                            {/* Preview of extracted content */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Preview
                                </h3>
                                {extractedFeatures.map((feature, index) => {
                                    const featureSpecs = extractedSpecs
                                        ? extractedSpecs.find((g) => g.featureName === feature.name)?.specifications
                                        : specifications.get(feature.name);
                                    const isExpanded = expandedFeature === feature.name;

                                    return (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => setExpandedFeature(isExpanded ? null : feature.name)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-left">
                                                    <span className="font-medium text-gray-900">
                                                        {feature.name}
                                                    </span>
                                                    {featureSpecs && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            {featureSpecs.length} specs
                                                        </span>
                                                    )}
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                            {isExpanded && (
                                                <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                                                    <p className="text-sm text-gray-600 py-2">
                                                        {feature.description}
                                                    </p>
                                                    {featureSpecs && featureSpecs.length > 0 && (
                                                        <div className="space-y-2 mt-2">
                                                            <p className="text-xs font-medium text-gray-500 uppercase">
                                                                Specifications
                                                            </p>
                                                            {featureSpecs.map((spec, specIndex) => (
                                                                <div
                                                                    key={specIndex}
                                                                    className="p-2 rounded bg-white border border-gray-200"
                                                                >
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {spec.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                        {spec.initialDescription}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isApplying}
                    >
                        {showPreview ? "Cancel" : "Close"}
                    </Button>
                    {showPreview && !error && (
                        <Button
                            onClick={handleApply}
                            disabled={isApplying}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isApplying ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Apply to Project
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
