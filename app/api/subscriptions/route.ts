import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { getActiveSubscription, getSubscriptionByUserId } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/subscriptions
 * Get current user's subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    const subscription = await getActiveSubscription(user.id);

    if (!subscription) {
      return createSuccessResponse({
        plan: 'free',
        status: 'inactive',
        storageLimit: 1073741824, // 1GB
        storageUsed: 0,
        bandwidthLimit: 10737418240, // 10GB
        bandwidthUsed: 0,
        message: 'No active subscription found',
      });
    }

    return createSuccessResponse({
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
    });
  } catch (error: any) {
    logger.error('Get subscription error', error);
    return apiErrors.internalServerError('Failed to get subscription', error.message);
  }
}

