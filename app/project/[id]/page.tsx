"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Layers, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getProject, ProjectData } from "@/app/actions/projects";

export default function ProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { userId } = useAuth();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProject() {
            try {
                const data = await getProject(params.id);
                setProject(data);
            } catch (error) {
                console.error("Failed to load project:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProject();
    }, [params.id]);

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

    return (
        <div className="p-8 max-w-4xl">
            <Breadcrumb items={[{ label: project.name }]} />

            <div className="mt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                        {project.description && (
                            <p className="mt-2 text-gray-600">{project.description}</p>
                        )}
                    </div>
                    {userId && (
                        <Button
                            onClick={() => router.push(`/new/feature/${project.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Feature
                        </Button>
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
                                    onClick={() => router.push(`/new/feature/${project.id}`)}
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
                                    onClick={() => router.push(`/feature/${feature.id}`)}
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
            </div>
        </div>
    );
}
