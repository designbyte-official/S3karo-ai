"use client";

import { S3Client } from "@aws-sdk/client-s3";
import { getS3Config } from "./config";

export const createS3Client = async () => {
  const config = await getS3Config();
  
  if (!config) {
    throw new Error("S3 configuration not found. Please configure your AWS credentials in settings.");
  }

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

export const getS3Bucket = async (): Promise<string> => {
  const config = await getS3Config();
  if (!config) {
    throw new Error("S3 bucket not configured");
  }
  return config.bucket;
};

