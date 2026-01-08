import React from "react";

import Image from "next/image";

import { convertFileSize } from "@/features/shared/utils";

interface UsageSummaryCardProps {
  title: string;
  size: number;
  icon: string;
  latestDate: string;
}

export const UsageSummaryCard = ({ title, size, icon, latestDate }: UsageSummaryCardProps) => {
  return (
    <li className="dashboard-summary-card">
      <div className="space-y-4">
        <div className="flex justify-between gap-3">
          <Image src={icon} width={100} height={100} alt={title} className="summary-type-icon" />
          <h4 className="summary-type-size">{convertFileSize(size) || "0 Bytes"}</h4>
        </div>

        <h5 className="summary-type-title">{title}</h5>
        <div className="separator" />
        <p className="caption text-center text-light-200">
          {latestDate ? new Date(latestDate).toLocaleString() : "No files"}
        </p>
      </div>
    </li>
  );
};
