import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // CloudFront/CDN URL or S3 API endpoint (e.g., MinIO custom endpoint)
  cdnUrl?: string; // For viewing files via CDN/CloudFront (NOT for S3 API operations)
}

export const getS3Client = (config: S3Config) => {
  // IMPORTANT: Only use 'endpoint' for S3 API operations (e.g., MinIO)
  // NEVER use 'cdnUrl' here - it's only for viewing files, not API operations
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint || undefined, // Only S3 API endpoint, NOT cdnUrl
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
  },
};
