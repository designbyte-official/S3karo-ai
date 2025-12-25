"use client";

import React, { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { S3File as File } from "@/types/file";

interface LocalSearchProps {
    files: File[];
    onFilteredFilesChange: (filtered: File[]) => void;
}

const LocalSearch = ({ files, onFilteredFilesChange }: LocalSearchProps) => {
    const [query, setQuery] = useState("");

    const handleSearch = (value: string) => {
        setQuery(value);

        if (!value.trim()) {
            onFilteredFilesChange(files);
            return;
        }

        const lowerQuery = value.toLowerCase();
        const filtered = files.filter(file =>
            file.name.toLowerCase().includes(lowerQuery)
        );
        onFilteredFilesChange(filtered);
    };

    const handleClear = () => {
        setQuery("");
        onFilteredFilesChange(files);
    };

    return (
        <div className="relative flex-1 sm:flex-none sm:w-80">
            <div className="search-input-wrapper !bg-light-300 relative">
                <SearchIcon size={20} className="text-light-200" />
                <Input
                    value={query}
                    placeholder="Filter files..."
                    className="search-input pr-8"
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-light-200 hover:text-light-100 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LocalSearch;
