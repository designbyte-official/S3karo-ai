import { NextRequest, NextResponse } from "next/server";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import {
  createPlatformS3Client,
  getPlatformS3Bucket,
  getFileUrl,
} from "@/features/managed-storage/services/platform-s3.service";
import { generateStorageKey } from "@/features/managed-storage/utils/storage-key";
import { validateFileName } from "@/features/private-s3/utils/validation";
import { getFileType } from "@/features/shared/utils";
import { getCurrentUser } from "@/lib/auth/utils";
import { isDatabaseConfigured } from "@/lib/database/db";
import { getFilesForUser, createFile } from "@/lib/database/queries";
import { checkStorageLimit, incrementStorageUsage } from "@/lib/database/queries-subscriptions";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const types = searchParams.get("types")?.split(",") || [];
    const searchText = searchParams.get("searchText") || "";
    const sort = searchParams.get("sort") || "$createdAt-desc";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const files = await getFilesForUser(user.id, {
      types: types.length > 0 ? types : undefined,
      searchText: searchText || undefined,
      sort: sort || undefined,
      limit: limit || undefined,
    });

    const transformedFiles = files.map((file) => ({
      $id: file.id,
      id: file.id,
      name: file.name,
      type: file.type,
      extension: file.extension,
      size: Number(file.size),
      url: file.url,
      owner: {
        $id: user.id,
        fullName: user.fullName,
      },
      accountId: user.id,
      users: (file.sharedWith as string[]) || [],
      bucketFileId: file.storageKey,
      $createdAt: file.createdAt.toISOString(),
      $updatedAt: file.updatedAt.toISOString(),
    }));

    return createSuccessResponse({
      documents: transformedFiles,
      total: transformedFiles.length,
    });
  } catch (error: any) {
    logger.error("Get files error", error);
    return apiErrors.internalServerError("Internal server error", error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized();
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable("Database not configured");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const ownerId = formData.get("ownerId") as string;
    const accountId = formData.get("accountId") as string;
    const path = formData.get("path") as string;

    if (!file) {
      return apiErrors.badRequest("No file provided");
    }

    try {
      validateFileName(file.name);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    const storageCheck = await checkStorageLimit(user.id, file.size);
    if (!storageCheck.allowed) {
      return apiErrors.badRequest(
        `Storage limit exceeded. Available: ${(storageCheck.remaining / 1024 / 1024).toFixed(2)}MB, Required: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    const storageKey = generateStorageKey(user.id, file.name, path);

    try {
      logger.info("Attempting S3 upload", { bucket, key: storageKey });
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: file.type,
        })
      );
      logger.info("S3 upload successful", { bucket, key: storageKey });
    } catch (s3Error: any) {
      logger.error("S3 Upload Error", s3Error, {
        code: s3Error.code,
        requestId: s3Error.$metadata?.requestId,
        bucket,
        region: process.env.AWS_REGION,
      });
      return apiErrors.internalServerError("Failed to upload to storage", s3Error.message);
    }

    const url = getFileUrl(storageKey);
    const { type, extension } = getFileType(file.name);

    const dbFile = await createFile({
      userId: user.id,
      name: file.name,
      type,
      extension,
      size: file.size,
      url,
      storageKey,
    });

    await incrementStorageUsage(user.id, file.size);
    const transformedFile = {
      $id: dbFile.id,
      id: dbFile.id,
      name: dbFile.name,
      type: dbFile.type,
      extension: dbFile.extension,
      size: Number(dbFile.size),
      url: dbFile.url,
      owner: {
        $id: user.id,
        fullName: user.fullName,
      },
      accountId: user.id,
      users: (dbFile.sharedWith as string[]) || [],
      bucketFileId: dbFile.storageKey,
      $createdAt: dbFile.createdAt.toISOString(),
      $updatedAt: dbFile.updatedAt.toISOString(),
    };

    return createSuccessResponse(transformedFile);
  } catch (error: any) {
    logger.error("Upload file error", error);
    return apiErrors.internalServerError("Internal server error", error.message);
  }
}
