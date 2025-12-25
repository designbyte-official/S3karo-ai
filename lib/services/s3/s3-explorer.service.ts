/**
 * S3 EXPLORER SERVICE
 * 
 * High-level service for "Own S3" explorer functionality.
 * CONSUMES: s3CoreService
 * 100% Client-side friendly.
 */

import { s3CoreService, S3Config } from "./s3-core.service";
import { s3Utils } from "./s3-utils";
import { getFileType } from "@/lib/utils";
import { File as S3File } from "@/types/file";

export const s3ExplorerService = {
    /**
     * List files and folders with explorer-specific transformations
     */
    async listItems(params: {
        config: S3Config;
        ownerId: string;
        accountId: string;
        subPath?: string;
        searchText?: string;
        sort?: string;
        limit?: number;
        continuationToken?: string;
        types?: string[];
    }): Promise<{ documents: S3File[]; total: number; continuationToken?: string }> {
        const { config, ownerId, accountId, subPath = "", searchText, sort = "$createdAt-desc", limit = 100, continuationToken, types = [] } = params;

        // Use delimiter for explorer view, no delimiter for global search
        const delimiter = searchText ? undefined : '/';
        const prefix = s3Utils.formatUserPrefix(ownerId, accountId, subPath);

        const result = await s3CoreService.list(config, {
            prefix,
            continuationToken,
            maxKeys: limit,
            delimiter
        });

        // 1. Process Folders
        const folders: S3File[] = result.folders.map(folderPrefix => {
            const { fileName } = s3Utils.parseKey(folderPrefix);

            return {
                $id: folderPrefix,
                id: folderPrefix,
                name: fileName,
                type: 'folder' as any,
                extension: '',
                size: 0,
                url: '',
                owner: { $id: ownerId },
                accountId,
                users: [],
                bucketFileId: folderPrefix,
                key: folderPrefix,
                $createdAt: new Date().toISOString(),
                $updatedAt: new Date().toISOString(),
            };
        });

        // 2. Process Files
        const files: S3File[] = await Promise.all(
            result.objects.map(async (obj) => {
                const { fileName } = s3Utils.parseKey(obj.key);
                const fileTypeInfo = getFileType(fileName);
                const url = await s3CoreService.getSignedUrl(config, obj.key);

                return {
                    $id: obj.key,
                    id: obj.key,
                    name: fileName,
                    type: fileTypeInfo.type,
                    extension: fileTypeInfo.extension,
                    size: obj.size,
                    url,
                    owner: { $id: ownerId },
                    accountId,
                    users: [],
                    bucketFileId: obj.key,
                    key: obj.key,
                    $createdAt: obj.lastModified.toISOString(),
                    $updatedAt: obj.lastModified.toISOString(),
                };
            })
        );

        let allItems = [...folders, ...files];

        // 3. Filter by type
        if (types.length > 0) {
            allItems = allItems.filter((item) => types.includes(item.type) || item.type === ('folder' as any));
        }

        // 4. Client-side search (if global)
        if (searchText && !delimiter) {
            allItems = allItems.filter(item =>
                item.name.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // 5. Sort
        const [field, order] = sort.split("-");
        allItems.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            let valA: any = field === "$createdAt" ? new Date(a.$createdAt).getTime() : a.name.toLowerCase();
            let valB: any = field === "$createdAt" ? new Date(b.$createdAt).getTime() : b.name.toLowerCase();

            if (valA < valB) return order === "asc" ? -1 : 1;
            if (valA > valB) return order === "asc" ? 1 : -1;
            return 0;
        });

        return {
            documents: allItems,
            total: allItems.length,
            continuationToken: result.continuationToken,
        };
    },

    /**
     * Upload with explorer-specific metadata
     */
    async uploadFile(params: {
        config: S3Config;
        file: File;
        ownerId: string;
        accountId: string;
        path?: string; // S3 Prefix
    }) {
        const { config, file, ownerId, accountId, path = "" } = params;
        const fileTypeInfo = getFileType(file.name);

        // Generate S3 Key using Utilities (sanitized, unique)
        const key = s3Utils.generateUniqueKey(file.name, ownerId, accountId, path);

        return await s3CoreService.upload(config, file, key, {
            contentType: file.type || 'application/octet-stream',
            owner: ownerId,
            accountId,
            type: fileTypeInfo.type,
            extension: fileTypeInfo.extension,
            originalName: file.name,
        });
    },

    /**
     * Get Stats (Aggregated)
     */
    async getBucketStats(config: S3Config, prefix?: string) {
        // For Own S3, we don't have a database for indexed stats.
        // We calculate total usage by listing.
        const result = await s3CoreService.list(config, { prefix });
        const totalUsed = result.objects.reduce((acc, obj) => acc + obj.size, 0);

        return {
            image: { size: 0, latestDate: "" },
            document: { size: 0, latestDate: "" },
            video: { size: 0, latestDate: "" },
            audio: { size: 0, latestDate: "" },
            other: { size: 0, latestDate: "" },
            used: totalUsed,
            all: 2 * 1024 * 1024 * 1024 * 1024, // 2TB Soft Limit for UI
        };
    }
};
