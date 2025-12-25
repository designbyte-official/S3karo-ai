"use client";

import React from "react";
import { S3File as File } from "@/types/file";
import { Chart } from "./Chart";
import FileList from "./FileList";
import { convertFileSize } from "@/features/shared/utils";

interface Props {
    files: File[];
    totalSpace: any;
    currentUser: any;
}

const DashboardClient = ({ files, totalSpace, currentUser }: Props) => {
    return (
        <div className="dashboard-container">
            <section>
                <Chart used={totalSpace?.used || 0} />

                {/* Summary */}
                <ul className="dashboard-summary-list">
                    {['image', 'video', 'document', 'audio', 'other'].map((type) => {
                        const stats = totalSpace?.[type] || { size: 0, latestDate: "" };
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
                                        {stats.latestDate ? new Date(stats.latestDate).toLocaleDateString() : "No files"}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="dashboard-recent-files">
                <h2 className="h2 text-light-100">Recent files uploaded</h2>
                {files.length > 0 ? (
                    <FileList files={files} />
                ) : (
                    <p className="empty-list">No files uploaded yet</p>
                )}
            </section>
        </div>
    );
};

export default DashboardClient;
