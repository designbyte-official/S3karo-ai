"use client";

import React from "react";
import { S3File } from "@/types/file";
import { StorageChart } from "./StorageChart";
import { convertFileSize } from "@/features/shared/utils";
import FileList from "@/features/managed-storage/components/FileList";
import { S3Config } from "@/features/private-s3/services/s3-config.service";

interface DashboardLayoutProps {
    files: S3File[];
    totalSpace: {
        used: number;
        all?: number;
        image?: { size: number; latestDate: string };
        video?: { size: number; latestDate: string };
        audio?: { size: number; latestDate: string };
        document?: { size: number; latestDate: string };
        other?: { size: number; latestDate: string };
    };
    currentUser?: any;
    variant?: "brand" | "blue";
    title?: string;
    isLoading?: boolean;
}

export const DashboardLayout = ({
    files,
    totalSpace,
    currentUser,
    variant = "brand",
    title = "Recent files uploaded",
    isLoading = false
}: DashboardLayoutProps) => {
    return (
        <div className="dashboard-container">
            <section>
                <StorageChart used={totalSpace?.used || 0} total={totalSpace?.all} variant={variant} />

                {/* Summary */}
                <ul className="dashboard-summary-list">
                    {["image", "video", "document", "audio", "other"].map((type) => {
                        const stats = (totalSpace as any)?.[type] || { size: 0, latestDate: "" };
                        return (
                            <li key={type} className="dashboard-summary-card">
                                <div className="space-y-4">
                                    <div className="flex justify-between gap-3">
                                        <p className="summary-type-size">
                                            {convertFileSize(stats.size)}
                                        </p>
                                    </div>
                                    <h5 className="summary-type-title capitalize">{type}s</h5>
                                    <div className="separator" />
                                    <p className="caption text-light-200">
                                        {stats.latestDate
                                            ? new Date(stats.latestDate).toLocaleDateString()
                                            : "No files"}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="dashboard-recent-files">
                <h2 className="h2 text-light-100">{title}</h2>
                {isLoading ? (
                    <p className="body-1 mt-10 text-center text-light-200">Loading...</p>
                ) : files.length > 0 ? (
                    <FileList files={files} currentUser={currentUser} />
                ) : (
                    <p className="empty-list">No files uploaded yet</p>
                )}
            </section>
        </div>
    );
};
