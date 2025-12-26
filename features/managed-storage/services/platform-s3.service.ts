import { S3Client } from "@aws-sdk/client-s3";

export const createPlatformS3Client = () => {
    return new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: !!process.env.S3_ENDPOINT,
    });
};

export const getPlatformS3Bucket = () => {
    return process.env.AWS_S3_BUCKET!;
};

/**
 * Generates a file URL using CDN if available, otherwise falls back to S3 direct URL
 * @param storageKey - The S3 storage key (e.g., "managed/{userId}/{path}/{filename}")
 * @returns The complete file URL
 */
export const getFileUrl = (storageKey: string): string => {
    const cdnUrl = process.env.AWS_CDN_URL;
    
    if (cdnUrl) {
        // Remove trailing slash from CDN URL if present
        const normalizedCdn = cdnUrl.replace(/\/$/, '');
        // Remove leading slash from storage key if present
        const normalizedKey = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
        // Encode each path segment separately to preserve path structure
        const encodedKey = normalizedKey
            .split('/')
            .map(segment => encodeURIComponent(segment))
            .join('/');
        return `${normalizedCdn}/${encodedKey}`;
    }
    
    // Fallback to S3 direct URL if CDN not configured
    const bucket = getPlatformS3Bucket();
    const region = process.env.AWS_REGION || 'us-east-1';
    const normalizedKey = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
    // Encode path segments for S3 URL too
    const encodedKey = normalizedKey
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
};
