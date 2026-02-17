import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/utils";
import { getActiveSubscription } from "@/lib/database/queries-subscriptions";
import { getCache, setCache } from "@/lib/redis/cache";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/subscriptions
 * Get current user's subscription details
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized("Authentication required");
    }

    const cacheKey = `subscription:${user.id}`;
    const cached = await getCache<Record<string, unknown>>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached);
    }

    const subscription = await getActiveSubscription(user.id);

    let response;
    if (!subscription) {
      response = {
        plan: "free",
        status: "inactive",
        storageLimit: 1073741824, // 1GB
        storageUsed: 0,
        bandwidthLimit: 10737418240, // 10GB
        bandwidthUsed: 0,
        message: "No active subscription found",
      };
    } else {
      response = {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        storageLimit: Number(subscription.storageLimit || 1073741824),
        storageUsed: Number(subscription.storageUsed || 0),
        bandwidthLimit: Number(subscription.bandwidthLimit || 10737418240),
        bandwidthUsed: Number(subscription.bandwidthUsed || 0),
        currentPeriodStart: subscription.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        createdAt: subscription.createdAt.toISOString(),
        updatedAt: subscription.updatedAt.toISOString(),
      };
    }

    await setCache(cacheKey, response, 300);

    return createSuccessResponse(response);
  } catch (error: unknown) {
    logger.error("Get subscription error", error);
    return apiErrors.internalServerError("Failed to get subscription", error instanceof Error ? error.message : "Unknown error");
  }
}
