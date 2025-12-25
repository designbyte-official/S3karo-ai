/**
 * MANAGED STORAGE SERVICE
 * 
 * High-level service for "Managed Storage" (formerly Platform S3) functionality.
 * Handles database operations and managed storage system logic.
 */

import { File as S3File } from "@/types/file";
import { s3Utils } from "../s3/s3-utils";
import { getFileType } from "@/lib/utils";

// Base API URL for managed storage
const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const platformStorageService = {
    /**
     * Get managed files for a user
     */
    async getFiles(params: {
        userId: string;
        types?: string[];
        searchText?: string;
        sort?: string;
        limit?: number;
    }): Promise<{ documents: S3File[]; total: number }> {
        const { types = [], searchText = "", sort = "$createdAt-desc", limit } = params;

        const queryParams = new URLSearchParams({
            types: types.join(','),
            searchText,
            sort,
        });
        if (limit) queryParams.append('limit', limit.toString());

        const response = await fetch(`${API_BASE}/api/files?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch platform files');
        }

        return await response.json();
    },

    /**
     * Upload a file to Managed Storage
     * 1. Generate Key
     * 2. Get Presigned URL
     * 3. Upload to S3
     * 4. Register in DB
     */
    async uploadFile(params: {
        file: File;
        ownerId: string;
        accountId: string;
        path?: string;
    }): Promise<S3File> {
        const { file, ownerId, accountId, path = "" } = params;
        const fileTypeInfo = getFileType(file.name);

        // 1. Generate Unique Key
        const key = s3Utils.generateUniqueKey(file.name, ownerId, accountId, path);

        // 2. Get Presigned URL for Upload
        const presignedRes = await fetch(`${API_BASE}/api/s3/presigned-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'upload',
                key,
                contentType: file.type || 'application/octet-stream',
                storageMode: 'managed-storage',
            }),
        });

        if (!presignedRes.ok) {
            const err = await presignedRes.json();
            throw new Error(err.error || 'Failed to get upload URL');
        }

        const { url } = await presignedRes.json();

        // 3. Upload directly to S3
        const uploadRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });

        if (!uploadRes.ok) {
            throw new Error('Failed to upload file to S3');
        }

        // 4. Register in Database
        // Note: The URL is typically the public S3 URL or CDN URL
        // In this implementation, we can use a helper or the server will resolve it
        const s3PublicUrl = `${API_BASE}/api/files/download?key=${encodeURIComponent(key)}`;

        const registerRes = await fetch(`${API_BASE}/api/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: file.name,
                type: fileTypeInfo.type,
                extension: fileTypeInfo.extension,
                size: file.size,
                url: s3PublicUrl,
                storageKey: key,
                storageType: 'managed-storage',
            }),
        });

        if (!registerRes.ok) {
            const err = await registerRes.json();
            throw new Error(err.error || 'Failed to register file in database');
        }

        return await registerRes.json();
    },
    async renameFile(params: {
        fileId: string;
        name: string;
        extension: string;
        path: string;
    }) {
        const { fileId, name, extension, path } = params;
        const newName = `${name}.${extension}`;

        const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to rename file: ${errorText}`);
        }

        return await response.json();
    },

    /**
     * Delete managed file
     */
    async deleteFile(params: {
        fileId: string;
        path: string;
    }) {
        const { fileId, path } = params;
        const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete file: ${errorText}`);
        }

        return { status: 'success' };
    },

    /**
     * Share managed file
     */
    async shareFile(params: {
        fileId: string;
        emails: string[];
        path: string;
    }) {
        const { fileId, emails } = params;
        const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shared_with: emails }),
        });

        if (!response.ok) {
            throw new Error('Failed to update file users');
        }

        return await response.json();
    },

    /**
     * Get aggregated stats for managed storage
     */
    async getStorageStats(userId: string) {
        const response = await fetch(`${API_BASE}/api/files/space`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch platform storage stats');
        }

        return await response.json();
    },

    /**
     * Get a download/view URL for a managed file
     */
    async getDownloadUrl(key: string): Promise<string> {
        const response = await fetch(`${API_BASE}/api/s3/presigned-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'get',
                key,
                storageMode: 'managed-storage',
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to get download URL');
        }

        const { url } = await response.json();
        return url;
    },

    /**
     * Check if user has platform access (Pro status)
     */
    async checkPlatformAccess(): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE}/api/subscriptions/check`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
            });

            if (!response.ok) return false;

            const { hasPlatformAccess } = await response.json();
            return !!hasPlatformAccess;
        } catch (error) {
            console.error('Failed to check platform access:', error);
            return false;
        }
    }
};
