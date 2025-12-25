import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
}

export const getS3Client = (config: S3Config) => {
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
        endpoint: config.endpoint,
        forcePathStyle: !!config.endpoint,
    });
};

export const s3CoreService = {
    async getPresignedUrl(config: S3Config, key: string, expiresIn = 3600) {
        const client = getS3Client(config);
        const command = new PutObjectCommand({
            Bucket: config.bucket,
            Key: key,
        });
        return getSignedUrl(client, command, { expiresIn });
    },

    async getDownloadUrl(config: S3Config, key: string, expiresIn = 3600) {
        const client = getS3Client(config);
        const command = new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
        });
        return getSignedUrl(client, command, { expiresIn });
    }
};
