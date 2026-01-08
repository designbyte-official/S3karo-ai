"use client";

import React, { useState, useEffect, useMemo } from "react";

import { Search as SearchIcon, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { S3File as File } from "@/types/file";

interface LocalSearchProps {
    files: File[];
    onFilteredFilesChange: (filtered: File[]) => void;
}

const LocalSearch = ({ files, onFilteredFilesChange }: LocalSearchProps) => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300); // Debounce with 300ms delay

    // Memoize filtered results to avoid recalculating on every render
    const filteredFiles = useMemo(() => {
        if (!debouncedQuery.trim()) {
            return files;
        }

        const lowerQuery = debouncedQuery.toLowerCase();
        return files.filter(file =>
            file.name.toLowerCase().includes(lowerQuery)
        );
    }, [files, debouncedQuery]);

    // Update filtered files when debounced query changes
    useEffect(() => {
        onFilteredFilesChange(filteredFiles);
    }, [filteredFiles, onFilteredFilesChange]);

    const handleSearch = (value: string) => {
        setQuery(value);
    };

    const handleClear = () => {
        setQuery("");
        onFilteredFilesChange(files);
    };

    return (
        <div className="relative w-full sm:max-w-md sm:flex-1">
            <div className="search-input-wrapper relative !bg-light-300">
                <SearchIcon size={20} className="text-light-200" />
                <Input
                    value={query}
                    placeholder="Search in current folder..."
                    className="search-input pr-8"
                    onChange={(e) => handleSearch(e.target.value)}
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-light-200 transition-colors hover:text-light-100"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default LocalSearch;
