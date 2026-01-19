"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
    getProject,
    updateProject,
    changeMethodology,
    getMethodologyChangeImpact,
    ProjectData,
    MethodologyChangeImpact,
} from "@/app/actions/projects";
import { METHODOLOGIES, MethodologyId, getMethodology } from "@/config/methodologies";

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedMethodology, setSelectedMethodology] = useState<MethodologyId>("agile");

    // Methodology change dialog
    const [showMethodologyWarning, setShowMethodologyWarning] = useState(false);
    const [methodologyImpact, setMethodologyImpact] = useState<MethodologyChangeImpact | null>(null);
    const [pendingMethodology, setPendingMethodology] = useState<MethodologyId | null>(null);

    useEffect(() => {
        async function loadProject() {
            try {
                const data = await getProject(params.id);
                if (data) {
                    setProject(data);
                    setName(data.name);
                    setDescription(data.description || "");
                    setSelectedMethodology(data.methodology as MethodologyId);
                }
            } catch (error) {
                console.error("Failed to load project:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProject();
    }, [params.id]);

    const handleMethodologySelect = useCallback(async (newMethodology: MethodologyId) => {
        if (!project || newMethodology === project.methodology) {
            setSelectedMethodology(newMethodology);
            return;
        }

        // Check impact
        try {
            const impact = await getMethodologyChangeImpact(project.id, newMethodology);
            if (impact.willOrphanPhases || impact.willCreatePhases) {
                setMethodologyImpact(impact);
                setPendingMethodology(newMethodology);
                setShowMethodologyWarning(true);
            } else {
                setSelectedMethodology(newMethodology);
            }
        } catch (error) {
            console.error("Failed to check methodology impact:", error);
            setSelectedMethodology(newMethodology);
        }
    }, [project]);

    const confirmMethodologyChange = useCallback(() => {
        if (pendingMethodology) {
            setSelectedMethodology(pendingMethodology);
        }
        setShowMethodologyWarning(false);
        setPendingMethodology(null);
        setMethodologyImpact(null);
    }, [pendingMethodology]);

    const cancelMethodologyChange = useCallback(() => {
        setShowMethodologyWarning(false);
        setPendingMethodology(null);
        setMethodologyImpact(null);
    }, []);

    const handleSave = async () => {
        if (!project) return;

        setIsSaving(true);
        try {
            // Update name and description
            await updateProject(project.id, {
                name: name.trim() || project.name,
                description: description.trim() || null,
            });

            // If methodology changed, use the special handler
            if (selectedMethodology !== project.methodology) {
                await changeMethodology(project.id, selectedMethodology);
            }

            router.push(`/project/${project.id}`);
        } catch (error) {
            console.error("Failed to save project:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-6"></div>
                    <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
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

    const currentMethodology = getMethodology(project.methodology as MethodologyId);
    const hasChanges =
        name !== project.name ||
        description !== (project.description || "") ||
        selectedMethodology !== project.methodology;

    return (
        <div className="p-8 max-w-2xl">
            <Breadcrumb
                items={[
                    { label: project.name, href: `/project/${project.id}` },
                    { label: "Settings" },
                ]}
            />

            <div className="mt-6">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-900">Project Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Project Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Optional description..."
                        />
                    </div>

                    {/* Methodology */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Methodology
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                            Choose how specifications are organized and what templates are available.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {METHODOLOGIES.map((methodology) => {
                                const isSelected = selectedMethodology === methodology.id;
                                const isCurrent = project.methodology === methodology.id;
                                return (
                                    <button
                                        key={methodology.id}
                                        onClick={() => handleMethodologySelect(methodology.id)}
                                        className={`relative p-4 text-left border rounded-lg transition-all ${
                                            isSelected
                                                ? `${methodology.color.border} ${methodology.color.bg} border-2`
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        {isCurrent && (
                                            <span className="absolute top-2 right-2 text-xs text-gray-500">
                                                Current
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${methodology.color.bg} ${methodology.color.text}`}
                                            >
                                                {methodology.shortName}
                                            </span>
                                            <span className="font-medium text-gray-900">
                                                {methodology.name}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{methodology.description}</p>
                                        {isSelected && (
                                            <div className="absolute bottom-2 right-2">
                                                <Check className="h-5 w-5 text-blue-600" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/project/${project.id}`)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>

            {/* Methodology Change Warning Dialog */}
            {showMethodologyWarning && methodologyImpact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={cancelMethodologyChange}
                    />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                            Change Methodology?
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            {methodologyImpact.willOrphanPhases ? (
                                <>
                                    Switching from BABOK will hide the phase-based workflow.
                                    {methodologyImpact.phasesWithData > 0 && (
                                        <>
                                            {" "}You have <strong>{methodologyImpact.phasesWithData} phases</strong> with
                                            data that will no longer be visible.
                                        </>
                                    )}
                                    {methodologyImpact.extractedItemsCount > 0 && (
                                        <>
                                            {" "}This includes <strong>{methodologyImpact.extractedItemsCount} extracted items</strong>.
                                        </>
                                    )}
                                    <br /><br />
                                    Your data is preserved and will reappear if you switch back.
                                </>
                            ) : methodologyImpact.willCreatePhases ? (
                                <>
                                    Switching to BABOK will enable the 5-phase requirements workflow.
                                    {methodologyImpact.featureCount > 0 && (
                                        <>
                                            {" "}Phases will be created for your <strong>{methodologyImpact.featureCount} existing features</strong>.
                                        </>
                                    )}
                                </>
                            ) : null}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={cancelMethodologyChange}>
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmMethodologyChange}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
