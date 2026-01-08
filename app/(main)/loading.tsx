import { ExplorerSkeleton } from "@/components/common/SkeletonLoader";

export default function Loading() {
    return (
        <div className="page-container !items-start !max-w-full lg:px-10">
            <header className="flex flex-col gap-6 mb-8 w-full">
                <div className="h-10 w-48 bg-light-300 animate-pulse rounded-lg" />
                <div className="h-20 w-full bg-light-300 animate-pulse rounded-[20px]" />
            </header>
            <ExplorerSkeleton view="grid" />
        </div>
    );
}
