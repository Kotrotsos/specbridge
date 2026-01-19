"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Sparkles, Lock, ChevronDown } from "lucide-react";
import { createProject, checkProjectLimit, ProjectLimitInfo } from "@/app/actions/projects";
import { METHODOLOGIES, MethodologyId } from "@/config/methodologies";

export default function NewProjectPage() {
    const router = useRouter();
    const { isLoaded, userId } = useAuth();
    const { organization } = useOrganization();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [methodology, setMethodology] = useState<MethodologyId>("agile");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [limitInfo, setLimitInfo] = useState<ProjectLimitInfo | null>(null);
    const [isCheckingLimit, setIsCheckingLimit] = useState(true);

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push("/");
        }
    }, [isLoaded, userId, router]);

    useEffect(() => {
        async function loadLimitInfo() {
            setIsCheckingLimit(true);
            try {
                const info = await checkProjectLimit();
                setLimitInfo(info);
            } catch (error) {
                console.error("Failed to check project limit:", error);
            } finally {
                setIsCheckingLimit(false);
            }
        }
        if (userId) {
            loadLimitInfo();
        }
    }, [userId, organization?.id]);

    if (!isLoaded || !userId || isCheckingLimit) {
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

    // Show upgrade prompt if limit reached
    if (limitInfo && !limitInfo.canCreate) {
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

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl">Project limit reached</CardTitle>
                        <CardDescription className="text-base">
                            You've created {limitInfo.currentCount} of {limitInfo.limit} projects on the free plan.
                            Upgrade to Pro for unlimited projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-gray-900">Pro Plan Benefits</h4>
                                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                        <li>Unlimited projects</li>
                                        <li>Unlimited specifications</li>
                                        <li>Priority support</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-2">
                        <Link href="/pricing" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Upgrade to Pro
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => router.back()} className="w-full">
                            Maybe later
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            // Create the project and navigate to it
            const project = await createProject({
                name,
                description,
                methodology
            });

            // Navigate to the new project page so it's selected in sidebar
            router.push(`/project/${project.id}`);
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
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Create New Project</h1>
                    <p className="text-gray-500 mt-2">
                        Projects help you organize your specifications and features into high-level groups.
                    </p>
                    {limitInfo && !limitInfo.isPro && (
                        <p className="text-sm text-gray-400 mt-2">
                            {limitInfo.currentCount} of {limitInfo.limit} projects used on free plan
                        </p>
                    )}
                </div>

                <Card className="border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FolderPlus className="h-5 w-5" />
                                </div>
                            </div>
                            <CardTitle>Project Details</CardTitle>
                            <CardDescription>
                                Give your project a name and description to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Project Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., E-Commerce Platform"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What is this project about?"
                                    className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="methodology" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Methodology
                                </label>
                                <div className="relative">
                                    <select
                                        id="methodology"
                                        value={methodology}
                                        onChange={(e) => setMethodology(e.target.value as MethodologyId)}
                                        className="flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {METHODOLOGIES.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {METHODOLOGIES.find((m) => m.id === methodology)?.description}
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!name.trim() || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? "Creating..." : "Create Project"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
