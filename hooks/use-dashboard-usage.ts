import { useMemo } from "react";
import { getUsageSummary } from "@/features/shared/utils";

interface TotalSpace {
    used: number;
    all?: number;
    image?: { size: number; latestDate: string };
    video?: { size: number; latestDate: string };
    audio?: { size: number; latestDate: string };
    document?: { size: number; latestDate: string };
    other?: { size: number; latestDate: string };
}

export const useDashboardUsage = (totalSpace: TotalSpace) => {
    const usageSummary = useMemo(() => {
        return totalSpace.document ? getUsageSummary(totalSpace) : [];
    }, [totalSpace]);

    return {
        usageSummary,
        hasDetailedUsage: totalSpace.document !== undefined
    };
};
