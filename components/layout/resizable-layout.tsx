"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ProjectSidebar } from "@/components/sidebar/project-sidebar";

interface ResizableLayoutProps {
    children: React.ReactNode;
    showSidebar?: boolean;
}

export function ResizableLayout({ children, showSidebar = true }: ResizableLayoutProps) {
    if (!showSidebar) {
        return <main className="flex-1 overflow-auto">{children}</main>;
    }

    return (
        <PanelGroup direction="horizontal" className="flex-1">
            <Panel
                defaultSize={20}
                minSize={15}
                maxSize={40}
                className="h-full"
            >
                <ProjectSidebar />
            </Panel>
            <PanelResizeHandle className="w-1.5 bg-gray-200 hover:bg-blue-400 transition-colors flex items-center justify-center group cursor-col-resize">
                <div className="w-0.5 h-8 rounded-full bg-gray-400 group-hover:bg-blue-500 transition-colors" />
            </PanelResizeHandle>
            <Panel defaultSize={80} minSize={50} className="h-full">
                <main className="h-full overflow-auto">{children}</main>
            </Panel>
        </PanelGroup>
    );
}
