import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/utils";
import { isDatabaseConfigured } from "@/lib/database/db";
import { createApiKey, getApiKeysForUser } from "@/lib/database/queries";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized("Authentication required");
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable("Database not configured");
    }

    const keys = await getApiKeysForUser(user.id);

    return createSuccessResponse({
      keys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        expiresAt: k.expiresAt?.toISOString() || null,
        isActive: k.isActive,
        rateLimit: Number(k.rateLimit),
        createdAt: k.createdAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    logger.error("Get API keys error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiErrors.internalServerError("Failed to get API keys", message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized("Authentication required");
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable("Database not configured");
    }

    const body = await request.json();
    const { name, expiresAt, rateLimit } = body;

    if (!name || typeof name !== "string") {
      return apiErrors.badRequest("Name is required and must be a string");
    }

    const result = await createApiKey({
      userId: user.id,
      name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      rateLimit: rateLimit || 1000,
    });

    return createSuccessResponse(
      {
        key: result.key,
        prefix: result.prefix,
        id: result.apiKey.id,
        name: result.apiKey.name,
        expiresAt: result.apiKey.expiresAt?.toISOString() || null,
        rateLimit: Number(result.apiKey.rateLimit),
        createdAt: result.apiKey.createdAt.toISOString(),
        warning: "Save this API key now. It will not be shown again.",
      },
      201,
      "API key created successfully"
    );
  } catch (error: unknown) {
    logger.error("Create API key error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return apiErrors.internalServerError("Failed to create API key", message);
  }
}
