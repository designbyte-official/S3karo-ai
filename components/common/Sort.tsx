"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Sort = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const sortValue = searchParams.get("sort") || "$createdAt-desc";
  const isUpdatingRef = useRef(false);

  const handleSort = useCallback((value: string) => {
    // Prevent infinite loops by checking if we're already updating
    if (isUpdatingRef.current) return;
    
    // Only update if the value actually changed
    if (value === sortValue) return;
    
    isUpdatingRef.current = true;
    
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", value);
      router.replace(`${path}?${params.toString()}`, { scroll: false });
    } finally {
      // Reset the flag after a short delay to allow the update to complete
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [searchParams, router, path, sortValue]);

  // Memoize the sort value to prevent unnecessary re-renders
  const memoizedSortValue = useMemo(() => sortValue, [sortValue]);

  return (
    <Select value={memoizedSortValue} onValueChange={handleSort}>
      <SelectTrigger className="sort-select">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent className="sort-select-content">
        <SelectItem value="$createdAt-desc" className="shad-select-item">
          Date (newest)
        </SelectItem>
        <SelectItem value="$createdAt-asc" className="shad-select-item">
          Date (oldest)
        </SelectItem>
        <SelectItem value="name-asc" className="shad-select-item">
          Name (A-Z)
        </SelectItem>
        <SelectItem value="name-desc" className="shad-select-item">
          Name (Z-A)
        </SelectItem>
        <SelectItem value="size-desc" className="shad-select-item">
          Size (largest)
        </SelectItem>
        <SelectItem value="size-asc" className="shad-select-item">
          Size (smallest)
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default Sort;
