"use client";

import React, { useEffect, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Search as SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { useDebounce } from "@/hooks/useDebounce";
import { S3File as File } from "@/types/file";

import FormattedDateTime from "./FormattedDateTime";
import Thumbnail from "./Thumbnail";

interface Props {
  mode?: "managed" | "private";
}

const Search = ({ mode = "managed" }: Props) => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const path = usePathname();
  const debouncedQuery = useDebounce(query, 500);

  // Sync query from URL only on mount or when URL changes externally
  useEffect(() => {
    if (searchQuery !== query && !query) {
      setQuery(searchQuery);
    }
  }, [searchQuery]);

  // Update URL only after debounce completes
  useEffect(() => {
    if (debouncedQuery !== searchQuery) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set("query", debouncedQuery);
      } else {
        params.delete("query");
      }
      router.replace(`${path}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedQuery]);

  // Fetch search results
  useEffect(() => {
    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setOpen(false);
        return;
      }

      if (user) {
        try {
          if (mode === "private") {
            const userId = user.id;
            const config = await s3ConfigService.getConfig(userId);
            if (!config) {
              setResults([]);
              return;
            }
            const filesData = await s3ExplorerService.listItems({
              config,
              searchText: debouncedQuery,
              ownerId: userId,
              accountId: user.accountId || userId,
            });
            setResults(filesData.documents);
          } else {
            const results = await platformStorageService.getFiles({
              types: [],
              searchText: debouncedQuery,
            });
            setResults(results.documents);
          }
          setOpen(true);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        }
      }
    };

    if (user) {
      fetchFiles();
    }
  }, [debouncedQuery, user, mode]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(false); // Close results when typing starts
    setResults([]); // Clear results when typing starts
  };

  const handleClickItem = (file: File) => {
    setOpen(false);
    setResults([]);

    if (mode === "private") {
      router.push(`/private/explorer?query=${file.name}`);
      return;
    }

    router.push(
      `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${debouncedQuery}`
    );
  };

  return (
    <div className="search">
      <div className="search-input-wrapper !bg-light-300">
        <SearchIcon size={20} className="text-light-200" />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={handleSearch}
        />

        {open && mode !== "private" && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) => (
                <li
                  className="flex items-center justify-between"
                  key={file.$id}
                  onClick={() => handleClickItem(file)}
                >
                  <div className="flex cursor-pointer items-center gap-4">
                    <Thumbnail
                      type={file.type}
                      extension={file.extension}
                      url={file.url}
                      className="size-9 min-w-9"
                    />
                    <p className="subtitle-2 line-clamp-1 text-light-100">{file.name}</p>
                  </div>

                  <FormattedDateTime
                    date={file.$createdAt}
                    className="caption line-clamp-1 text-light-200"
                  />
                </li>
              ))
            ) : (
              <p className="empty-result">No files found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
