import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const useExplorerState = (initialFiles: any[]) => {
    const searchParams = useSearchParams();
    const searchText = searchParams.get("query") || "";

    const [view, setView] = useState<"grid" | "list">("grid");
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [filteredFiles, setFilteredFiles] = useState<any[]>([]);

    // Memoize the file IDs to prevent unnecessary updates
    const filesIdsRef = useRef<string>("");

    const memoizedFiles = useMemo(() => {
        const currentIds = initialFiles.map(f => f.$id || f.bucketFileId).join(",");
        if (currentIds !== filesIdsRef.current) {
            filesIdsRef.current = currentIds;
            return initialFiles;
        }
        return initialFiles;
    }, [initialFiles]);

    useEffect(() => {
        setFilteredFiles(memoizedFiles);
    }, [memoizedFiles]);

    return {
        view,
        setView,
        showThumbnails,
        setShowThumbnails,
        filteredFiles,
        setFilteredFiles,
        searchText
    };
};
