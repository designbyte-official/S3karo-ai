"use client";

import React from "react";
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

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${path}?${params.toString()}`, { scroll: false });
  };

  return (
    <Select value={sortValue} onValueChange={handleSort}>
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
