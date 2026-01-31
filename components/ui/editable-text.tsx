"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    variant?: "input" | "textarea";
    className?: string;
    placeholder?: string;
    viewAs?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export function EditableText({
    value,
    onSave,
    variant = "input",
    className = "",
    placeholder = "Click to edit",
    viewAs = "div",
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (tempValue.trim() === value) {
            setIsEditing(false);
            return;
        }

        try {
            setIsSaving(true);
            await onSave(tempValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
            // Optionally handle error state here
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && variant === "input") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className={`flex items-start gap-2 ${className} w-full`}>
                {variant === "textarea" ? (
                    <Textarea
                        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                        value={tempValue}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[100px] flex-1"
                        placeholder={placeholder}
                        disabled={isSaving}
                    />
                ) : (
                    <Input
                        ref={inputRef as React.RefObject<HTMLInputElement>}
                        value={tempValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                        placeholder={placeholder}
                        disabled={isSaving}
                    />
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                >
                    <Check className="h-4 w-4" />
                </button>
                <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        );
    }

    const ViewComponent = viewAs as any;

    return (
        <div className="group relative flex items-center pr-8 w-full">
            <ViewComponent
                className={`${className} cursor-text border border-transparent hover:border-gray-200 rounded px-1 -mx-1`}
                onClick={() => setIsEditing(true)}
            >
                {value || <span className="text-gray-400 italic">{placeholder}</span>}
            </ViewComponent>
            <button
                onClick={() => setIsEditing(true)}
                className="absolute right-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
            >
                <Pencil className="h-3 w-3" />
            </button>
        </div>
    );
}
