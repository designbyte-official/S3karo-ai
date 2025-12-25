"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shield, HardDrive, Info } from "lucide-react";

const StorageModeToggle = () => {
    const router = useRouter();
    const pathname = usePathname();

    const isPrivate = pathname.startsWith("/private");
    const mode = isPrivate ? "private" : "managed";

    const handleToggle = (newMode: "managed" | "private") => {
        if (newMode === "managed") {
            router.push("/");
        } else {
            router.push("/private/explorer");
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center bg-light-400 p-1 rounded-full border border-light-300 shadow-drop-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => handleToggle("managed")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300",
                                mode === "managed"
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-light-100 hover:bg-light-300"
                            )}
                        >
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-medium">Managed</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                        <p>Cloud storage managed by S3-Karo. Pro subscription required for some actions.</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => handleToggle("private")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300",
                                mode === "private"
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-light-100 hover:bg-light-300"
                            )}
                        >
                            <HardDrive className="w-4 h-4" />
                            <span className="text-sm font-medium">Private S3</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                        <p>Connect your own AWS S3 bucket. Private, unrestricted, and fully in your control.</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
};

export default StorageModeToggle;
