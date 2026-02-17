import { useMemo } from "react";

import { getUsageSummary, type TotalSpaceSummaryInput } from "@/features/shared/utils";

interface TotalSpace {
  used: number;
  all?: number;
  image?: { size: number; latestDate: string };
  video?: { size: number; latestDate: string };
  audio?: { size: number; latestDate: string };
  document?: { size: number; latestDate: string };
  other?: { size: number; latestDate: string };
}

function isTotalSpaceSummaryInput(ts: TotalSpace): ts is TotalSpace & TotalSpaceSummaryInput {
  return (
    ts.document != null &&
    ts.image != null &&
    ts.video != null &&
    ts.audio != null &&
    ts.other != null
  );
}

export const useDashboardUsage = (totalSpace: TotalSpace) => {
  const usageSummary = useMemo(() => {
    return isTotalSpaceSummaryInput(totalSpace) ? getUsageSummary(totalSpace) : [];
  }, [totalSpace]);

  return {
    usageSummary,
    hasDetailedUsage: totalSpace.document !== undefined,
  };
};
