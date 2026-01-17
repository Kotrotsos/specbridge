"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAllProjects, ProjectData } from "@/app/actions/projects";

interface UseProjectsReturn {
    projects: ProjectData[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const pathname = usePathname();

    const loadProjects = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getAllProjects();
            setProjects(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to load projects"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, [pathname]);

    return {
        projects,
        isLoading,
        error,
        refresh: loadProjects,
    };
}
