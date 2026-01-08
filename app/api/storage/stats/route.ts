import { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/utils';
import { getTotalSpaceUsed } from '@/lib/database/queries';
import { getActiveSubscription } from '@/lib/database/queries-subscriptions';
import { getCache, setCache } from '@/lib/redis/cache';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/storage/stats
 * Get storage statistics for current user
 * Returns both file type breakdown and subscription limits
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    const cacheKey = `storage-stats:${user.id}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
      return createSuccessResponse(cached);
    }

    // Get file type breakdown
    const totalSpace = await getTotalSpaceUsed(user.id);

    // Get subscription limits
    const subscription = await getActiveSubscription(user.id);
    
    const storageLimit = subscription 
      ? Number(subscription.storageLimit || 1073741824)
      : 1073741824; // Default 1GB
    
    const storageUsed = subscription
      ? Number(subscription.storageUsed || 0)
      : totalSpace.used;
    
    const bandwidthLimit = subscription
      ? Number(subscription.bandwidthLimit || 10737418240)
      : 10737418240; // Default 10GB
    
    const bandwidthUsed = subscription
      ? Number(subscription.bandwidthUsed || 0)
      : 0;

    const response = {
      files: {
        image: totalSpace.image,
        document: totalSpace.document,
        video: totalSpace.video,
        audio: totalSpace.audio,
        other: totalSpace.other,
        total: totalSpace.used,
      },
      subscription: {
        plan: subscription?.plan || 'free',
        status: subscription?.status || 'inactive',
        storage: {
          limit: storageLimit,
          used: storageUsed,
          remaining: Math.max(0, storageLimit - storageUsed),
          percentage: (storageUsed / storageLimit) * 100,
        },
        bandwidth: {
          limit: bandwidthLimit,
          used: bandwidthUsed,
          remaining: Math.max(0, bandwidthLimit - bandwidthUsed),
          percentage: (bandwidthUsed / bandwidthLimit) * 100,
        },
      },
    };

    await setCache(cacheKey, response, 60);

    return createSuccessResponse(response);
  } catch (error: any) {
    logger.error('Get storage stats error', error);
    return apiErrors.internalServerError('Failed to get storage stats', error.message);
  }
}

