import { S3Client } from "@aws-sdk/client-s3";

export const createPlatformS3Client = () => {
    return new S3Client({
        region: process.env.S3_REGION!,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: !!process.env.S3_ENDPOINT,
    });
};

export const getPlatformS3Bucket = () => {
    return process.env.S3_BUCKET_NAME!;
};
