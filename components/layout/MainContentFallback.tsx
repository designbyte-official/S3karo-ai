import { SkeletonGrid } from "@/components/common/SkeletonLoader";

export function MainContentFallback() {
  return (
    <div className="page-container">
      <section className="w-full">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-light-300" />
        <div className="total-size-section mt-4">
          <div className="h-5 w-24 animate-pulse rounded bg-light-300" />
          <div className="sort-container mt-2 flex items-center gap-2">
            <div className="h-5 w-16 animate-pulse rounded bg-light-300" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-light-300" />
          </div>
        </div>
      </section>
      <div className="mt-6">
        <SkeletonGrid count={8} />
      </div>
    </div>
  );
}
