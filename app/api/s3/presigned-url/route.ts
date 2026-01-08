import { NextRequest } from "next/server";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getCurrentUser } from "@/features/auth/actions/user.actions";
import {
  createPlatformS3Client,
  getPlatformS3Bucket,
} from "@/features/managed-storage/services/platform-s3.service";
import { hasPlatformAccess } from "@/lib/database/queries-subscriptions";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

/**
 * Generate presigned URL for S3 operations
 * Supports both OWN S3 (user's credentials) and MANAGED STORAGE (requires subscription)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized("Not authenticated");
    }

    const body = await request.json();
    const { operation, key, contentType, storageMode } = body;

    if (!operation || !key) {
      return apiErrors.badRequest("Missing required fields: operation, key");
    }

    // Check if Managed Storage requires subscription
    if (storageMode === "managed-storage" || storageMode === "platform-s3") {
      const access = await hasPlatformAccess(user.id);
      if (!access) {
        return apiErrors.forbidden("Managed Storage requires an active subscription");
      }
    }

    // For OWN S3, client handles presigned URLs directly
    // For MANAGED STORAGE, we generate presigned URLs server-side
    if (storageMode === "managed-storage" || storageMode === "platform-s3") {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();

      let command;
      if (operation === "get" || operation === "download") {
        command = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });
      } else if (operation === "put" || operation === "upload") {
        command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        });
      } else {
        return apiErrors.badRequest('Invalid operation. Use "get", "download", "put", or "upload"');
      }

      const expiresIn = operation === "get" || operation === "download" ? 3600 * 24 * 7 : 3600;

      const url = await getSignedUrl(client, command, { expiresIn });

      return createSuccessResponse({ url, expiresIn });
    }

    return createSuccessResponse({
      message: "Use client-side S3 operations for OWN S3 mode",
      note: "Presigned URLs are generated client-side using your AWS credentials",
    });
  } catch (error: any) {
    logger.error("Presigned URL error", error);
    return apiErrors.internalServerError("Internal server error", error.message);
  }
}
