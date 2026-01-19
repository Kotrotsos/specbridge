"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Layers } from "lucide-react";
import { createFeature } from "@/app/actions/features";

export default function NewFeaturePage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const router = useRouter();
    const { isLoaded, userId } = useAuth();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push("/");
        }
    }, [isLoaded, userId, router]);

    if (!isLoaded || !userId) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const feature = await createFeature(projectId, {
                name,
                description
            });

            // Navigate to the new feature page so it's selected in sidebar
            router.push(`/feature/${feature.id}`);
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
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Add New Feature</h1>
                    <p className="text-gray-500 mt-2">
                        Features represent distinct capabilities or modules within your project.
                    </p>
                </div>

                <Card className="border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Layers className="h-5 w-5" />
                                </div>
                            </div>
                            <CardTitle>Feature Details</CardTitle>
                            <CardDescription>
                                Define the feature you want to add to your project.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Feature Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., User Authentication"
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
                                    placeholder="Describe the purpose of this feature..."
                                    className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!name.trim() || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? "Adding..." : "Add Feature"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
