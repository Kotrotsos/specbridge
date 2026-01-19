"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, FileText, ChevronDown } from "lucide-react";
import { createSpecification } from "@/app/actions/specifications";
import { getFeatureWithProject } from "@/app/actions/features";
import { METHODOLOGIES, MethodologyId, SpecificationType, getMethodology, getDefaultSpecificationType } from "@/config/methodologies";

export default function NewSpecificationPage({ params }: { params: { featureId: string } }) {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const { featureId } = params;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [specificationType, setSpecificationType] = useState<SpecificationType>("user_story");
    const [methodology, setMethodology] = useState<MethodologyId>("agile");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push("/");
        }
    }, [isLoaded, userId, router]);

    useEffect(() => {
        async function loadFeature() {
            try {
                const feature = await getFeatureWithProject(featureId);
                if (feature?.project?.methodology) {
                    const meth = feature.project.methodology as MethodologyId;
                    setMethodology(meth);
                    setSpecificationType(getDefaultSpecificationType(meth));
                }
            } catch (error) {
                console.error("Failed to load feature:", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (userId) {
            loadFeature();
        }
    }, [featureId, userId]);

    if (!isLoaded || !userId || isLoading) {
        return (
            <div className="container max-w-2xl mx-auto py-12 px-4">
                <div className="animate-pulse">
                    <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
                    <div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const currentMethodology = getMethodology(methodology);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const spec = await createSpecification({
                id: `spec-${Date.now()}`,
                featureId,
                name,
                initialDescription: description,
                specificationType
            });

            // Navigate to the interview/spec page
            router.push(`/interview/${spec.id}`);
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Create New Specification</h1>
                    <p className="text-gray-500 mt-2">
                        Specifications capture the detailed requirements and logic for a specific part of a feature.
                    </p>
                </div>

                <Card className="border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>
                            <CardTitle>Specification Details</CardTitle>
                            <CardDescription>
                                Start by naming your specification. You'll refine the details in the studio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Specification Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Login Flow Requirements"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Initial Description <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe what this specification will cover..."
                                    className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="specificationType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Specification Type
                                </label>
                                <div className="relative">
                                    <select
                                        id="specificationType"
                                        value={specificationType}
                                        onChange={(e) => setSpecificationType(e.target.value as SpecificationType)}
                                        className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {currentMethodology?.specificationTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {currentMethodology?.specificationTypes.find((t) => t.id === specificationType)?.description}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!name.trim() || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? "Creating..." : "Start Specification"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
