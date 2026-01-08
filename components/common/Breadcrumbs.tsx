import React from "react";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
    subPath: string;
    onNavigate: (path: string) => void;
}

export const Breadcrumbs = ({ subPath, onNavigate }: BreadcrumbsProps) => {
    const parts = subPath.split("/").filter(Boolean);

    const handleBack = () => {
        if (parts.length > 0) {
            const newParts = [...parts];
            newParts.pop();
            onNavigate(newParts.join("/"));
        }
    };

    return (
        <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto">
            {/* Navigation Arrows */}
            <div className="flex shrink-0 items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg hover:bg-light-300 disabled:opacity-30"
                    onClick={handleBack}
                    disabled={!subPath}
                    title="Go back"
                    aria-label="Navigate to parent folder"
                >
                    <ChevronRight size={16} className="rotate-180" aria-hidden="true" />
                </Button>
                <div className="h-5 w-px bg-light-300" />
            </div>

            {/* Breadcrumbs */}
            <Button
                variant="ghost"
                className="flex h-8 shrink-0 items-center gap-2 rounded-xl px-3 text-light-100 hover:bg-light-300"
                onClick={() => onNavigate("")}
            >
                <span className={!subPath ? "text-sm font-bold text-brand" : "text-sm font-medium"}>
                    Root
                </span>
            </Button>

            {parts.map((part, i) => {
                const path = parts.slice(0, i + 1).join("/");
                const isLast = i === parts.length - 1;

                return (
                    <React.Fragment key={path}>
                        <ChevronRight size={14} className="shrink-0 text-light-200 opacity-50" />
                        <Button
                            variant="ghost"
                            className="h-8 shrink-0 rounded-xl px-3 text-light-100 hover:bg-light-300"
                            onClick={() => onNavigate(path)}
                        >
                            <span className={isLast ? "text-sm font-bold text-brand" : "text-sm font-medium"}>
                                {part}
                            </span>
                        </Button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
