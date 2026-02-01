"use client";

import { useState, useCallback, useRef } from "react";
import {
    Upload,
    FileText,
    File,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Eye,
} from "lucide-react";
import {
    uploadSpecificationDocument,
    deleteSpecificationDocument,
    getSpecificationDocuments,
    SpecificationDocumentData,
} from "@/app/actions/specification-documents";

interface DocumentUploadProps {
    specificationId: string;
    documents: SpecificationDocumentData[];
    onDocumentsChange: (documents: SpecificationDocumentData[]) => void;
}

const FILE_ICONS: Record<string, typeof FileText> = {
    pdf: FileText,
    docx: File,
    txt: File,
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
    specificationId,
    documents,
    onDocumentsChange,
}: DocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isExpanded, setIsExpanded] = useState(documents.length > 0);
    const [viewingDocument, setViewingDocument] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            setIsUploading(true);
            setUploadError(null);

            try {
                for (const file of Array.from(files)) {
                    const formData = new FormData();
                    formData.append("file", file);

                    await uploadSpecificationDocument(specificationId, formData);
                }

                // Refresh documents list
                const updatedDocs = await getSpecificationDocuments(specificationId);
                onDocumentsChange(updatedDocs);
                setIsExpanded(true);
            } catch (error) {
                console.error("Upload error:", error);
                setUploadError(
                    error instanceof Error ? error.message : "Upload failed"
                );
            } finally {
                setIsUploading(false);
            }
        },
        [specificationId, onDocumentsChange]
    );

    const handleDelete = useCallback(
        async (documentId: string) => {
            try {
                await deleteSpecificationDocument(documentId);
                const updatedDocs = await getSpecificationDocuments(specificationId);
                onDocumentsChange(updatedDocs);
            } catch (error) {
                console.error("Delete error:", error);
            }
        },
        [specificationId, onDocumentsChange]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const viewingDoc = documents.find((d) => d.id === viewingDocument);

    return (
        <div className="border-t border-border">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-background-sidebar transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-foreground-muted" />
                    <span className="text-sm font-medium text-foreground">
                        Documents
                    </span>
                    {documents.length > 0 && (
                        <span className="text-xs text-foreground-muted">
                            ({documents.length})
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-foreground-muted" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-foreground-muted" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="px-4 pb-4">
                    {/* Upload area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                            ${isDragging
                                ? "border-blue-400 bg-blue-50"
                                : "border-border hover:border-gray-400 hover:bg-background-sidebar"
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            multiple
                            onChange={(e) => handleFiles(e.target.files)}
                            className="hidden"
                        />
                        {isUploading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <span className="text-sm text-foreground-muted">
                                    Uploading...
                                </span>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-6 w-6 mx-auto text-foreground-muted mb-2" />
                                <p className="text-sm text-foreground-muted">
                                    Drop files here or click to upload
                                </p>
                                <p className="text-xs text-foreground-muted mt-1">
                                    PDF, DOCX, TXT (max 10MB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Error message */}
                    {uploadError && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {uploadError}
                        </div>
                    )}

                    {/* Document list */}
                    {documents.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {documents.map((doc) => {
                                const Icon = FILE_ICONS[doc.fileType] || File;
                                return (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background-card group"
                                    >
                                        <Icon className="h-4 w-4 text-foreground-muted shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {doc.fileName}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span>.</span>
                                                {doc.status === "processing" ? (
                                                    <span className="flex items-center gap-1 text-blue-600">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        Extracting text...
                                                    </span>
                                                ) : doc.status === "extracted" ? (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Text extracted
                                                    </span>
                                                ) : doc.status === "error" ? (
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {doc.error || "Error"}
                                                    </span>
                                                ) : (
                                                    <span>Uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {doc.extractedText && (
                                                <button
                                                    onClick={() => setViewingDocument(doc.id)}
                                                    className="p-1.5 rounded text-foreground-muted hover:bg-background-sidebar hover:text-foreground transition-colors"
                                                    title="View extracted text"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 rounded text-foreground-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Delete document"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Extracted text modal */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setViewingDocument(null)}
                    />
                    <div className="relative z-10 w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-lg flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <div>
                                <h3 className="font-medium text-foreground">
                                    {viewingDoc.fileName}
                                </h3>
                                <p className="text-xs text-foreground-muted">
                                    Extracted text content
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingDocument(null)}
                                className="p-1 rounded text-foreground-muted hover:bg-background-sidebar hover:text-foreground transition-colors"
                            >
                                <AlertCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <pre className="whitespace-pre-wrap text-sm text-foreground-secondary font-mono">
                                {viewingDoc.extractedText}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
