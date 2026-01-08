"use client";

import React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Shield, HardDrive } from "lucide-react";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const StorageModeToggle = () => {
    const pathname = usePathname();

    const isPrivate = pathname.startsWith("/private");
    const mode = isPrivate ? "private" : "managed";

    return (
        <TooltipProvider>
            <div className="flex items-center rounded-full border border-light-300 bg-light-400 p-1 shadow-drop-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href="/dashboard"
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 active:scale-95 hover:scale-105",
                                mode === "managed"
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-light-100 hover:bg-light-300"
                            )}
                        >
                            <Shield className="size-4" />
                            <span className="text-sm font-medium">Managed</span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                        <p>Cloud storage managed by S3-Karo. Pro subscription required for some actions.</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href="/private/explorer"
                            className={cn(
                                "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 active:scale-95 hover:scale-105",
                                mode === "private"
                                    ? "bg-brand text-white shadow-sm"
                                    : "text-light-100 hover:bg-light-300"
                            )}
                        >
                            <HardDrive className="size-4" />
                            <span className="text-sm font-medium">Private S3</span>
                        </Link>
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
