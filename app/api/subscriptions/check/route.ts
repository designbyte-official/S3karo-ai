import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/utils";
import { isDatabaseConfigured } from "@/lib/database/db";
import { hasPlatformAccess } from "@/lib/database/queries-subscriptions";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized("Authentication required");
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return createSuccessResponse({
        hasPlatformAccess: false,
        message:
          "Database not configured. Platform S3 requires database for subscription management.",
      });
    }

    try {
      const access = await hasPlatformAccess(user.id);
      return createSuccessResponse({
        hasPlatformAccess: access,
      });
    } catch (dbError: any) {
      // If database schema is missing columns, return false but don't break the app
      logger.warn("Subscription check failed (database schema may be outdated)", dbError);
      return createSuccessResponse({
        hasPlatformAccess: false,
        message: "Database schema may need migration. Run: pnpm db:fix-columns",
      });
    }
  } catch (error: any) {
    logger.error("Check subscription error", error);
    // Return false instead of error to prevent breaking private S3
    return createSuccessResponse({
      hasPlatformAccess: false,
      message: "Unable to check subscription access",
    });
  }
}
