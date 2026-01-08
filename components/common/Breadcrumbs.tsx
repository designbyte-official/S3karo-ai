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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-2">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-light-300 disabled:opacity-30"
                    onClick={handleBack}
                    disabled={!subPath}
                    title="Go back"
                    aria-label="Navigate to parent folder"
                >
                    <ChevronRight size={16} className="rotate-180" aria-hidden="true" />
                </Button>
                <div className="w-px h-5 bg-light-300" />
            </div>

            {/* Breadcrumbs */}
            <Button
                variant="ghost"
                className="h-8 px-3 text-light-100 hover:bg-light-300 rounded-xl flex items-center gap-2 shrink-0"
                onClick={() => onNavigate("")}
            >
                <span className={!subPath ? "font-bold text-brand text-sm" : "font-medium text-sm"}>
                    Root
                </span>
            </Button>

            {parts.map((part, i) => {
                const path = parts.slice(0, i + 1).join("/");
                const isLast = i === parts.length - 1;

                return (
                    <React.Fragment key={path}>
                        <ChevronRight size={14} className="text-light-200 shrink-0 opacity-50" />
                        <Button
                            variant="ghost"
                            className="h-8 px-3 text-light-100 hover:bg-light-300 rounded-xl shrink-0"
                            onClick={() => onNavigate(path)}
                        >
                            <span className={isLast ? "font-bold text-brand text-sm" : "font-medium text-sm"}>
                                {part}
                            </span>
                        </Button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
