import { S3Client } from "@aws-sdk/client-s3";

/**
 * Server-side S3 client for PLATFORM S3
 * Uses environment variables for credentials
 */
export const createPlatformS3Client = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Platform S3 configuration not found. Please configure AWS credentials in environment variables.");
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const getPlatformS3Bucket = (): string => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("Platform S3 bucket not configured");
  }
  return bucket;
};

