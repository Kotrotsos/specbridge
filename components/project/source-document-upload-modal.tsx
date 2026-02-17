"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Upload, FileText, File, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadProjectSourceDocument } from "@/app/actions/project-source-documents";

interface SourceDocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onUploadComplete: () => void;
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

export function SourceDocumentUploadModal({
    isOpen,
    onClose,
    projectId,
    onUploadComplete,
}: SourceDocumentUploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isUploading) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, isUploading, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        const ext = file.name.toLowerCase().split(".").pop();
        if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
            setUploadError("Unsupported file type. Please use PDF, DOCX, or TXT.");
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError("File too large. Maximum size is 10MB.");
            return;
        }

        setSelectedFile(file);
        setUploadError(null);
    }, []);

    const handleFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            handleFileSelect(files[0]);
        },
        [handleFileSelect]
    );

    const handleUpload = useCallback(async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            await uploadProjectSourceDocument(projectId, formData);
            onUploadComplete();
            onClose();
        } catch (error) {
            console.error("Upload error:", error);
            setUploadError(
                error instanceof Error ? error.message : "Upload failed"
            );
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, projectId, onUploadComplete, onClose]);

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

    const handleClose = useCallback(() => {
        if (!isUploading) {
            setSelectedFile(null);
            setUploadError(null);
            onClose();
        }
    }, [isUploading, onClose]);

    if (!isOpen) return null;

    const FileIcon = selectedFile
        ? FILE_ICONS[selectedFile.name.split(".").pop()?.toLowerCase() || ""] || File
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
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Upload Source Document
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!selectedFile ? (
                        <>
                            {/* Drop zone */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                                    ${isDragging
                                        ? "border-blue-400 bg-blue-50"
                                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                    }
                                `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => handleFiles(e.target.files)}
                                    className="hidden"
                                />
                                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                                <p className="text-sm font-medium text-gray-700">
                                    Drop your file here or click to browse
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    PDF, DOCX, or TXT (max 10MB)
                                </p>
                            </div>

                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Upload a document to extract features and specifications using AI.
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Selected file preview */}
                            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                                {FileIcon && (
                                    <FileIcon className="h-10 w-10 text-gray-400 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(selectedFile.size)}
                                    </p>
                                </div>
                                {!isUploading && (
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {uploadError && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {uploadError}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
