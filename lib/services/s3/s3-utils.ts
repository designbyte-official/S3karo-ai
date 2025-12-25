/**
 * S3 UTILITIES
 * 
 * Shared logic for key generation, sanitization, and path formatting.
 * Used by s3-explorer.service and platform-storage.service.
 */

export const s3Utils = {
    /**
     * Generate a unique S3 key for a file with timestamp and random string
     */
    generateUniqueKey(fileName: string, ownerId: string, accountId: string, subPath: string = ""): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const nameParts = fileName.split('.');
        const extension = nameParts.length > 1 ? nameParts.pop() : '';
        const baseName = nameParts.join('.');

        const sanitizedBase = this.sanitizeFileName(baseName);
        const uniqueName = `${timestamp}-${randomString}-${sanitizedBase}${extension ? '.' + extension : ''}`;

        const prefix = this.formatUserPrefix(ownerId, accountId, subPath);
        return `${prefix}${uniqueName}`;
    },

    /**
     * Sanitize filename: remove special characters, spaces to underscores
     */
    sanitizeFileName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9._-]/g, '')
            .replace(/_{2,}/g, '_');
    },

    /**
     * Format S3 prefix for a specific user and account
     */
    formatUserPrefix(ownerId: string, accountId: string, subPath: string = ""): string {
        const base = `${ownerId}/${accountId}/`;
        if (!subPath) return base;
        return `${base}${subPath.endsWith('/') ? subPath : subPath + '/'}`;
    },

    /**
     * Extract file info from S3 key
     */
    parseKey(key: string): { ownerId: string; accountId: string; fileName: string } {
        const parts = key.split('/');
        return {
            ownerId: parts[0] || '',
            accountId: parts[1] || '',
            fileName: parts[parts.length - 1] || key,
        };
    }
};
