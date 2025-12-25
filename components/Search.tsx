"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { s3ExplorerService } from "@/lib/services/s3/s3-explorer.service";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import { File } from "@/types/file";
import { useAuthStore } from "@/lib/stores/auth-store";

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [results, setResults] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const path = usePathname();
  const [debouncedQuery] = useDebounce(query, 300);

  // No need for fetchUser effect as we use Zustand story

  useEffect(() => {
    const updateUrl = () => {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set("query", debouncedQuery);
      } else {
        params.delete("query");
      }
      router.push(`${path}?${params.toString()}`);
    };

    if (debouncedQuery !== searchQuery) {
      updateUrl();
    }
  }, [debouncedQuery, path, router, searchParams, searchQuery]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setOpen(false);
        return;
      }

      const mode = s3ConfigService.getMode();
      let files;

      if (user) {
        try {
          if (mode === 'own-s3') {
            const config = await s3ConfigService.getConfig(user.$id);
            if (!config) {
              setResults([]);
              return;
            }
            const filesData = await s3ExplorerService.listItems({
              config,
              searchText: debouncedQuery,
              ownerId: user.$id,
              accountId: user.accountId,
            });
            setResults(filesData.documents);
          } else if (mode === 'managed-storage' || mode === 'platform-s3') {
            const filesData = await platformStorageService.getFiles({
              userId: user.$id,
              searchText: debouncedQuery,
            });
            setResults(filesData.documents);
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
  }, [debouncedQuery, user]);

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  const handleClickItem = (file: File) => {
    setOpen(false);
    setResults([]);

    router.push(
      `/${file.type === "video" || file.type === "audio" ? "media" : file.type + "s"}?query=${query}`,
    );
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="Search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />

        {open && (
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
                    <p className="subtitle-2 line-clamp-1 text-light-100">
                      {file.name}
                    </p>
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
