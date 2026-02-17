import { ExplorerSkeleton } from "@/components/common/SkeletonLoader";

export default function DashboardLoading() {
  return (
    <div className="page-container !max-w-full !items-start lg:px-10">
      <header className="mb-8 flex w-full flex-col gap-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-light-300" />
        <div className="h-20 w-full animate-pulse rounded-[20px] bg-light-300" />
      </header>
      <ExplorerSkeleton view="list" />
    </div>
  );
}
