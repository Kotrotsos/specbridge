"use client";

import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { updateProject, deleteProject, reorderProjects } from "@/app/actions/projects";
import { updateFeature, deleteFeature, reorderFeatures } from "@/app/actions/features";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export function ProjectSidebar() {
    const { projects, isLoading, refresh } = useProjects();
    const router = useRouter();
    const { userId } = useAuth();
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const toggleFeature = (featureId: string) => {
        const newExpanded = new Set(expandedFeatures);
        if (newExpanded.has(featureId)) {
            newExpanded.delete(featureId);
        } else {
            newExpanded.add(featureId);
        }
        setExpandedFeatures(newExpanded);
    };

    const handleCreateProject = () => {
        router.push("/new/project");
    };

    const handleNavigateToProject = (projectId: string) => {
        router.push(`/project/${projectId}`);
    };

    const handleNavigateToFeature = (featureId: string) => {
        router.push(`/feature/${featureId}`);
    };

    const handleRename = (id: string, type: "project" | "feature", currentName: string) => {
        setEditingId(id);
        setEditingName(currentName);
    };

    const saveRename = async (id: string, type: "project" | "feature") => {
        if (!editingName.trim()) return;

        try {
            if (type === "project") {
                await updateProject(id, { name: editingName });
            } else {
                await updateFeature(id, { name: editingName });
            }
            await refresh();
        } finally {
            setEditingId(null);
            setEditingName("");
        }
    };

    const handleDelete = async (id: string, type: "project" | "feature", name: string) => {
        if (!confirm(`Delete ${type} "${name}"?`)) return;

        if (type === "project") {
            await deleteProject(id);
        } else {
            await deleteFeature(id);
        }
        await refresh();
    };

    const moveUp = async (items: any[], index: number, reorderFn: (ids: string[]) => Promise<void>) => {
        if (index === 0) return;
        const newItems = [...items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        await reorderFn(newItems.map(item => item.id));
        await refresh();
    };

    const moveDown = async (items: any[], index: number, reorderFn: (ids: string[]) => Promise<void>) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        await reorderFn(newItems.map(item => item.id));
        await refresh();
    };

    if (isLoading) {
        return (
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col h-screen">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Projects</h2>
                {userId && (
                    <button
                        onClick={handleCreateProject}
                        className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                )}
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-2">
                {projects.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 text-center">
                        {userId ? "No projects yet. Create one to get started!" : "Please sign in to view and create projects."}
                    </div>
                ) : (
                    projects.map((project, projectIndex) => (
                        <div key={project.id} className="mb-1">
                            {/* Project Item */}
                            <div className="group flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-200 min-h-[32px]">
                                <button
                                    onClick={() => toggleProject(project.id)}
                                    className="p-0.5 hover:bg-gray-300 rounded flex-shrink-0"
                                >
                                    {expandedProjects.has(project.id) ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>

                                {editingId === project.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => saveRename(project.id, "project")}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveRename(project.id, "project");
                                            if (e.key === "Escape") setEditingId(null);
                                        }}
                                        className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        onClick={() => handleNavigateToProject(project.id)}
                                        className="flex-1 text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                                    >
                                        {project.name}
                                    </span>
                                )}

                                {/* Hover Actions - Only visible if logged in */}
                                {userId && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRename(project.id, "project", project.name)}
                                            className="p-1 hover:bg-gray-300 rounded"
                                            title="Rename"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(project.id, "project", project.name)}
                                            className="p-1 hover:bg-red-200 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-600" />
                                        </button>
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => moveUp(projects, projectIndex, reorderProjects)}
                                                disabled={projectIndex === 0}
                                                className="p-0.5 hover:bg-gray-300 rounded disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <ChevronRight className="w-3 h-3 -rotate-90" />
                                            </button>
                                            <button
                                                onClick={() => moveDown(projects, projectIndex, reorderProjects)}
                                                disabled={projectIndex === projects.length - 1}
                                                className="p-0.5 hover:bg-gray-300 rounded disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <ChevronRight className="w-3 h-3 rotate-90" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            {expandedProjects.has(project.id) && (
                                <div className="ml-4 mt-1">
                                    {project.features.map((feature, featureIndex) => (
                                        <div key={feature.id} className="mb-1">
                                            {/* Feature Item */}
                                            <div className="group flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-200 min-h-[32px]">
                                                <button
                                                    onClick={() => toggleFeature(feature.id)}
                                                    className="p-0.5 hover:bg-gray-300 rounded flex-shrink-0"
                                                >
                                                    {expandedFeatures.has(feature.id) || (feature.specificationCount ?? 0) <= 1 ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {editingId === feature.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onBlur={() => saveRename(feature.id, "feature")}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") saveRename(feature.id, "feature");
                                                            if (e.key === "Escape") setEditingId(null);
                                                        }}
                                                        className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => handleNavigateToFeature(feature.id)}
                                                        className="flex-1 text-sm text-gray-700 truncate cursor-pointer hover:text-blue-600"
                                                    >
                                                        {feature.name}
                                                        {(feature.specificationCount ?? 0) > 0 && (
                                                            <span className="ml-1 text-xs text-gray-500">
                                                                ({feature.specificationCount})
                                                            </span>
                                                        )}
                                                    </span>
                                                )}

                                                {/* Hover Actions - Only visible if logged in */}
                                                {userId && (
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleRename(feature.id, "feature", feature.name)}
                                                            className="p-1 hover:bg-gray-300 rounded"
                                                            title="Rename"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(feature.id, "feature", feature.name)}
                                                            className="p-1 hover:bg-red-200 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-red-600" />
                                                        </button>
                                                        <div className="flex flex-col">
                                                            <button
                                                                onClick={() => moveUp(project.features, featureIndex, (ids) => reorderFeatures(project.id, ids))}
                                                                disabled={featureIndex === 0}
                                                                className="p-0.5 hover:bg-gray-300 rounded disabled:opacity-30"
                                                                title="Move up"
                                                            >
                                                                <ChevronRight className="w-3 h-3 -rotate-90" />
                                                            </button>
                                                            <button
                                                                onClick={() => moveDown(project.features, featureIndex, (ids) => reorderFeatures(project.id, ids))}
                                                                disabled={featureIndex === project.features.length - 1}
                                                                className="p-0.5 hover:bg-gray-300 rounded disabled:opacity-30"
                                                                title="Move down"
                                                            >
                                                                <ChevronRight className="w-3 h-3 rotate-90" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Specifications - show when expanded or when only 1 spec */}
                                            {(expandedFeatures.has(feature.id) || (feature.specificationCount ?? 0) <= 1) && feature.specifications && feature.specifications.length > 0 && (
                                                <div className="ml-6 mt-1 space-y-0.5">
                                                    {feature.specifications.map((spec) => (
                                                        <div
                                                            key={spec.id}
                                                            onClick={() => router.push(`/interview/${spec.id}`)}
                                                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer group"
                                                        >
                                                            <FileText className="w-3.5 h-3.5 text-gray-500" />
                                                            <span className="flex-1 text-sm text-gray-600 truncate hover:text-blue-600">
                                                                {spec.name}
                                                            </span>
                                                            <span
                                                                className={`text-xs px-1.5 py-0.5 rounded ${
                                                                    spec.status === "complete"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : "bg-yellow-100 text-yellow-700"
                                                                }`}
                                                            >
                                                                {spec.status === "complete" ? "Done" : "WIP"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
