"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, FileText, Clock, Play, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getFeature, FeatureData, updateFeature } from "@/app/actions/features";
import { getFeaturePhases, PhaseData, updatePhaseStatus } from "@/app/actions/phases";
import { createSpecification, addMessage, updateSpecification } from "@/app/actions/specifications";
import { BABOK_PHASES, getPhaseIntro, PhaseNumber } from "@/config/babok-phases";
import { useProgress } from "@/components/ui/progress-bar";
import { EditableText } from "@/components/ui/editable-text";

export default function FeaturePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { userId } = useAuth();
    const { start: startProgress } = useProgress();
    const [feature, setFeature] = useState<FeatureData | null>(null);
    const [phases, setPhases] = useState<PhaseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isBabok = feature?.project?.methodology === "babok";

    useEffect(() => {
        async function loadFeature() {
            try {
                const data = await getFeature(id);
                setFeature(data);

                // Load phases for BABOK projects
                if (data?.project?.methodology === "babok") {
                    const phaseData = await getFeaturePhases(id);
                    setPhases(phaseData);
                }
            } catch (error) {
                console.error("Failed to load feature:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadFeature();
    }, [id]);

    const handleStartPhase = async (phase: PhaseData) => {
        if (!feature) return;
        startProgress();

        try {
            // Check if there's already an interview for this phase
            const existingSpec = feature.specifications?.find(s => s.phaseId === phase.id);

            if (existingSpec) {
                // Navigate to existing interview
                router.push(`/interview/${existingSpec.id}`);
                return;
            }

            // Update phase status to in_progress
            await updatePhaseStatus(phase.id, "in_progress");

            // Create a new interview for this phase
            const phaseLabel = getPhaseLabel(phase.phaseName);
            const newInterview = await createSpecification({
                id: `phase-${phase.id}-${Date.now()}`,
                featureId: feature.id,
                phaseId: phase.id,
                name: `${phaseLabel} Interview`,
                initialDescription: `BABOK Phase ${phase.phaseNumber}: ${phaseLabel}`,
                status: "in_progress",
            });

            // Add the phase intro message as the first assistant message
            const introMessage = getPhaseIntro(phase.phaseNumber as PhaseNumber);
            if (introMessage) {
                await addMessage(newInterview.id, {
                    id: `intro-${Date.now()}`,
                    role: "assistant",
                    content: introMessage,
                });
            }

            // Refresh data and navigate
            const phaseData = await getFeaturePhases(id);
            setPhases(phaseData);
            router.push(`/interview/${newInterview.id}`);
        } catch (error) {
            console.error("Failed to start phase:", error);
        }
    };

    const navigateWithProgress = (path: string) => {
        startProgress();
        router.push(path);
    };

    const handleUpdateFeature = async (field: "name" | "description", value: string) => {
        if (!feature) return;
        try {
            const updated = await updateFeature(feature.id, { [field]: value });
            if (updated) {
                setFeature(updated);
            }
        } catch (error) {
            console.error("Failed to update feature:", error);
        }
    };

    const handleUpdateSpecification = async (specId: string, field: "name" | "initialDescription", value: string) => {
        try {
            const updated = await updateSpecification(specId, { [field]: value });
            if (updated && feature) {
                // Determine which field to update in the local state
                setFeature({
                    ...feature,
                    specifications: feature.specifications?.map(s =>
                        s.id === specId
                            ? {
                                ...s,
                                name: updated.name,
                                initialDescription: updated.initialDescription,
                                updatedAt: updated.updatedAt
                            }
                            : s
                    )
                });
            }
        } catch (error) {
            console.error("Failed to update specification:", error);
        }
    };

    const getPhaseLabel = (phaseName: string) => {
        const phase = BABOK_PHASES.find(p => p.name === phaseName);
        return phase?.label ?? phaseName;
    };

    const getPhaseDuration = (phaseName: string) => {
        const phase = BABOK_PHASES.find(p => p.name === phaseName);
        return phase?.duration ?? "";
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
                    <div className="flex-1 mr-4">
                        <EditableText
                            value={feature.name}
                            onSave={(val) => handleUpdateFeature("name", val)}
                            viewAs="h1"
                            className="text-2xl font-semibold text-gray-900"
                            placeholder="Feature Name"
                        />
                        <div className="mt-2">
                            <EditableText
                                value={feature.description || ""}
                                onSave={(val) => handleUpdateFeature("description", val)}
                                viewAs="p"
                                variant="textarea"
                                className="text-gray-600 block w-full"
                                placeholder="Add a description..."
                            />
                        </div>
                    </div>
                    {userId && (
                        <div className="shrink-0">
                            <Button
                                onClick={() => navigateWithProgress(`/new/specification/${feature.id}`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Specification
                            </Button>
                        </div>
                    )}
                </div>

                {/* BABOK Phase Management */}
                {isBabok && phases.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">BABOK Phases</h2>
                        {/* ... (BABOK phases code unchanged for now as they are specialized) ... */}
                        <div className="grid gap-3">
                            {phases.map((phase) => {
                                const isComplete = phase.status === "complete";
                                const isInProgress = phase.status === "in_progress";
                                const isNotStarted = phase.status === "not_started";
                                // Allow starting any phase
                                const canStart = isNotStarted;

                                return (
                                    <div
                                        key={phase.id}
                                        className={`border rounded-lg p-4 ${isComplete
                                                ? "border-green-200 bg-green-50"
                                                : isInProgress
                                                    ? "border-blue-200 bg-blue-50"
                                                    : "border-gray-200 bg-white"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isComplete
                                                            ? "bg-green-500 text-white"
                                                            : isInProgress
                                                                ? "bg-blue-500 text-white"
                                                                : "bg-gray-200 text-gray-600"
                                                        }`}
                                                >
                                                    {isComplete ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        phase.phaseNumber
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {getPhaseLabel(phase.phaseName)}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {getPhaseDuration(phase.phaseName)}
                                                        {phase.specificationCount > 0 && (
                                                            <span className="ml-2">
                                                                {phase.specificationCount} interview{phase.specificationCount !== 1 ? "s" : ""}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs ${isComplete
                                                            ? "bg-green-100 text-green-800"
                                                            : isInProgress
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {isComplete ? "Complete" : isInProgress ? "In Progress" : "Not Started"}
                                                </span>
                                                {userId && (isInProgress || canStart) && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStartPhase(phase)}
                                                        className={
                                                            isInProgress
                                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                                : "bg-gray-600 hover:bg-gray-700 text-white"
                                                        }
                                                    >
                                                        {isInProgress ? (
                                                            <>Continue <ChevronRight className="ml-1 w-4 h-4" /></>
                                                        ) : (
                                                            <>Start <Play className="ml-1 w-3 h-3" /></>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Regular Specifications */}
                <div className="mt-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {isBabok ? "All Interviews" : "Specifications"}
                    </h2>

                    {!feature.specifications || feature.specifications.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-4 text-sm font-medium text-gray-900">
                                {isBabok ? "No interviews yet" : "No specifications yet"}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {isBabok
                                    ? "Start with Phase 1 above to begin gathering requirements."
                                    : "Start documenting this feature by adding a specification."}
                            </p>
                            {userId && !isBabok && (
                                <Button
                                    onClick={() => navigateWithProgress(`/new/specification/${feature.id}`)}
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
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 mr-4">
                                            <div
                                                className="p-2 bg-green-100 rounded-lg cursor-pointer"
                                                onClick={() => navigateWithProgress(`/interview/${spec.id}`)}
                                            >
                                                <FileText className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <EditableText
                                                        value={spec.name}
                                                        onSave={(val) => handleUpdateSpecification(spec.id, "name", val)}
                                                        viewAs="h3"
                                                        className="font-medium text-gray-900"
                                                        placeholder="Specification Name"
                                                    />
                                                </div>
                                                <EditableText
                                                    value={spec.initialDescription || ""}
                                                    onSave={(val) => handleUpdateSpecification(spec.id, "initialDescription", val)}
                                                    viewAs="div"
                                                    variant="textarea"
                                                    className="text-sm text-gray-500 block w-full mb-2"
                                                    placeholder="Add a description..."
                                                />
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(spec.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            onClick={() => navigateWithProgress(`/interview/${spec.id}`)}
                                            className={`rounded-full px-3 py-1 text-xs cursor-pointer ${spec.status === "complete"
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
