import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/utils";
import { getTotalSpaceUsed } from "@/lib/database/queries";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized("Authentication required");
    }

    // Get total space using Drizzle
    const totalSpace = await getTotalSpaceUsed(user.id);

    return createSuccessResponse(totalSpace);
  } catch (error: unknown) {
    logger.error("Get space error", error);
    return apiErrors.internalServerError("Failed to get storage space", error instanceof Error ? error.message : "Unknown error");
  }
}
