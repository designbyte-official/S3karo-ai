"use client";

import { S3Client, ListBucketsCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getS3Config, type S3Config } from "./config";

export type ConnectionStatus = "idle" | "checking" | "connected" | "disconnected" | "invalid";

export interface ConnectionResult {
  status: ConnectionStatus;
  message: string;
  error?: string;
}

/**
 * Test S3 connection with provided credentials
 */
export const testS3Connection = async (config?: S3Config): Promise<ConnectionResult> => {
  try {
    const s3Config = config || getS3Config();
    
    if (!s3Config) {
      return {
        status: "disconnected",
        message: "No S3 configuration found",
        error: "Please configure your AWS credentials",
      };
    }

    // Validate config fields
    if (!s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.region || !s3Config.bucket) {
      return {
        status: "invalid",
        message: "Incomplete configuration",
        error: "Please fill in all required fields",
      };
    }

    // Create S3 client
    const client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });

    // Test connection by checking if bucket exists and is accessible
    // Using HeadBucketCommand which is lightweight and checks permissions
    try {
      await client.send(
        new HeadBucketCommand({
          Bucket: s3Config.bucket,
        })
      );

      return {
        status: "connected",
        message: "Successfully connected to S3",
      };
    } catch (error: any) {
      // If bucket doesn't exist or no permission, try listing buckets to check credentials
      if (error.name === "NotFound" || error.name === "403" || error.name === "Forbidden") {
        try {
          // Try to list buckets to verify credentials are valid
          await client.send(new ListBucketsCommand({}));
          
          return {
            status: "invalid",
            message: "Bucket not found or no access",
            error: `Bucket "${s3Config.bucket}" not found or you don't have access. Please check the bucket name and IAM permissions.`,
          };
        } catch (listError: any) {
          return {
            status: "invalid",
            message: "Invalid credentials",
            error: "Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.",
          };
        }
      }

      return {
        status: "invalid",
        message: "Connection failed",
        error: error.message || "Failed to connect to S3",
      };
    }
  } catch (error: any) {
    return {
      status: "invalid",
      message: "Connection error",
      error: error.message || "Unknown error occurred",
    };
  }
};

/**
 * Validate S3 configuration format (without testing connection)
 */
export const validateS3Config = (config: Partial<S3Config>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.accessKeyId || config.accessKeyId.trim() === "") {
    errors.push("Access Key ID is required");
  } else if (config.accessKeyId.length < 16) {
    errors.push("Access Key ID appears to be invalid (too short)");
  }

  if (!config.secretAccessKey || config.secretAccessKey.trim() === "") {
    errors.push("Secret Access Key is required");
  } else if (config.secretAccessKey.length < 20) {
    errors.push("Secret Access Key appears to be invalid (too short)");
  }

  if (!config.region || config.region.trim() === "") {
    errors.push("Region is required");
  }

  if (!config.bucket || config.bucket.trim() === "") {
    errors.push("Bucket name is required");
  } else if (config.bucket.length < 3) {
    errors.push("Bucket name appears to be invalid (too short)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

