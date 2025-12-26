import { S3File as File } from "@/types/file";

export const platformStorageService = {
    async getFiles(params: {
        types?: string[];
        searchText?: string;
        sort?: string;
        limit?: number;
    }): Promise<{ documents: File[]; total: number }> {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/files?` + new URLSearchParams({
                types: params.types?.join(',') || '',
                searchText: params.searchText || '',
                sort: params.sort || '',
                limit: params.limit?.toString() || '10'
            }));
            if (!response.ok) throw new Error('Failed to fetch files');
            return await response.json();
        } catch (error) {
            console.error('Error fetching platform files:', error);
            return { documents: [], total: 0 };
        }
    },

    async getStorageStats(userId?: string) {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/files/space`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
            });
            if (!response.ok) {
                return {
                    used: 0,
                    total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
                    files: []
                };
            }
            const data = await response.json();
            return {
                used: data.used || 0,
                total: data.all || 2 * 1024 * 1024 * 1024 * 1024, // 2TB
                files: []
            };
        } catch (error) {
            console.error('Error fetching storage stats:', error);
            return {
                used: 0,
                total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
                files: []
            };
        }
    },

    async uploadFile(params: { file: File; ownerId: string; accountId: string; path: string }) {
        // DEPRECATED: Use useUpload() hook instead for direct S3 uploads
        // This method is kept for backward compatibility only
        throw new Error('Use useUpload() hook for file uploads. This method is deprecated.');
    },

    async renameFile(params: { fileId: string; name: string; extension: string; path: string }) {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/files/${params.fileId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${params.name}${params.extension}`,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to rename file');
            }
            return await response.json();
        } catch (error) {
            console.error('Error renaming file:', error);
            throw error;
        }
    },

    async deleteFile(params: { fileId: string; path: string }) {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/files/${params.fileId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete file');
            }
            return await response.json();
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    },

    async shareFile(params: { fileId: string; emails: string[]; path: string }) {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/files/${params.fileId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shared_with: params.emails,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to share file');
            }
            return await response.json();
        } catch (error) {
            console.error('Error sharing file:', error);
            throw error;
        }
    },

    async checkPlatformAccess(userId: string) {
        try {
            const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') : '';
            const response = await fetch(`${baseUrl}/api/subscriptions/check`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for authentication
            });
            if (!response.ok) {
                return { isPro: false };
            }
            const data = await response.json();
            return { isPro: data.hasPlatformAccess || false };
        } catch (error) {
            console.error('Error checking platform access:', error);
            return { isPro: false };
        }
    },

    async getDownloadUrl(bucketFileId: string) {
        return `/api/files/download/${bucketFileId}`;
    }
};

export interface S3Config {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
}
