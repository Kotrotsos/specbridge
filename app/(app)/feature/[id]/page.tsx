"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getFeature, FeatureData } from "@/app/actions/features";

export default function FeaturePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { userId } = useAuth();
    const [feature, setFeature] = useState<FeatureData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadFeature() {
            try {
                const data = await getFeature(params.id);
                setFeature(data);
            } catch (error) {
                console.error("Failed to load feature:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadFeature();
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

    if (!feature) {
        return (
            <div className="p-8">
                <p className="text-gray-500">Feature not found.</p>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: feature.project?.name ?? "Project", href: `/project/${feature.projectId}` },
        { label: feature.name },
    ];

    return (
        <div className="p-8 max-w-4xl">
            <Breadcrumb items={breadcrumbItems} />

            <div className="mt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{feature.name}</h1>
                        {feature.description && (
                            <p className="mt-2 text-gray-600">{feature.description}</p>
                        )}
                    </div>
                    {userId && (
                        <Button
                            onClick={() => router.push(`/new/specification/${feature.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Specification
                        </Button>
                    )}
                </div>

                <div className="mt-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>

                    {!feature.specifications || feature.specifications.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-sm font-medium text-gray-900">No specifications yet</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Start documenting this feature by adding a specification.
                            </p>
                            {userId && (
                                <Button
                                    onClick={() => router.push(`/new/specification/${feature.id}`)}
                                    variant="outline"
                                    className="mt-4"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Specification
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {feature.specifications.map((spec) => (
                                <div
                                    key={spec.id}
                                    onClick={() => router.push(`/interview/${spec.id}`)}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <FileText className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{spec.name}</h3>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(spec.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs ${
                                                spec.status === "complete"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {spec.status === "complete" ? "Complete" : "In Progress"}
                                        </span>
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
