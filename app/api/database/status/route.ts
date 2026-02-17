import { NextRequest } from "next/server";

import { isDatabaseConfigured } from "@/lib/database/db";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(_request: NextRequest) {
  try {
    const configured = isDatabaseConfigured();
    const isDevelopment = process.env.NODE_ENV === "development";

    return createSuccessResponse({
      configured,
      isDevelopment,
      message: configured
        ? "Database is configured and ready"
        : "Database is not configured. Add DATABASE_URL to .env.local",
    });
  } catch (error: unknown) {
    logger.error("Database status check error", error);
    return apiErrors.internalServerError("Internal server error", error instanceof Error ? error.message : "Unknown error");
  }
}
