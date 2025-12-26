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

// Generate file URL (CDN or S3)
export const getFileUrl = (storageKey: string): string => {
    const cdnUrl = process.env.AWS_CDN_URL;
    
    if (cdnUrl) {
        const normalizedCdn = cdnUrl.replace(/\/$/, '');
        const normalizedKey = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
        const encodedKey = normalizedKey
            .split('/')
            .map(segment => encodeURIComponent(segment))
            .join('/');
        return `${normalizedCdn}/${encodedKey}`;
    }
    
    const bucket = getPlatformS3Bucket();
    const region = process.env.AWS_REGION || 'us-east-1';
    const normalizedKey = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
    const encodedKey = normalizedKey
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
};
