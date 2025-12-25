"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sortTypes } from "@/constants";
import { ArrowUpDown } from "lucide-react";

const Sort = () => {
  const path = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${path}?${params.toString()}`, { scroll: false });
  };

  return (
    <Select onValueChange={handleSort} defaultValue={sortTypes[0].value}>
      <SelectTrigger className="sort-select !bg-light-300 !border-none !text-light-100 !h-11 rounded-xl shadow-none">
        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-light-200" />
          <SelectValue placeholder={sortTypes[0].value} />
        </div>
      </SelectTrigger>
      <SelectContent className="sort-select-content bg-white border-light-300 shadow-drop-3">
        {sortTypes.map((sort) => (
          <SelectItem
            key={sort.label}
            className="shad-select-item hover:bg-light-300"
            value={sort.value}
          >
            {sort.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Sort;
