import { db, isDatabaseConfigured } from './db';
import { subscriptions } from './schema';
import { eq, and, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Subscription, NewSubscription } from './schema';
import { cache } from 'react';
import { deleteCache } from '@/lib/redis/cache';
import { logger } from '@/lib/utils/logger';

/**
 * Get active subscription for a user
 */
export const getActiveSubscription = cache(async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  if (!db || !isDatabaseConfigured()) {
    return null;
  }
  try {
    // First try with all columns
    const result = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const subscription = result[0] as any;

    // Check if subscription is expired
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
      // Update status to expired
      await db
        .update(subscriptions)
        .set({ status: 'expired' })
        .where(eq(subscriptions.id, subscription.id));

      return null;
    }

    // Ensure default values for missing columns (in case schema is outdated)
    return {
      ...subscription,
      storageLimit: subscription.storageLimit ?? 1073741824, // 1GB default
      storageUsed: subscription.storageUsed ?? 0,
      bandwidthLimit: subscription.bandwidthLimit ?? 10737418240, // 10GB default
      bandwidthUsed: subscription.bandwidthUsed ?? 0,
    } as Subscription;
  } catch (error: any) {
    // Check if error is due to missing columns (database schema issue)
    if (error?.message?.includes('does not exist') || error?.code === '42703' || error?.cause?.code === '42703') {
      logger.warn('Subscription check failed (database schema may be outdated)', {
        query: error?.query || 'N/A',
        params: error?.params || 'N/A',
        cause: error?.cause
      });
      // Try fallback query with only core columns
      try {
        const fallbackResult = await db.execute(sql`
          SELECT id, user_id, plan, status, stripe_subscription_id, stripe_customer_id, 
                 current_period_start, current_period_end, cancel_at_period_end, 
                 created_at, updated_at
          FROM subscriptions 
          WHERE user_id = ${userId} AND status = 'active' 
          LIMIT 1
        `);

        if (fallbackResult.rows.length === 0) return null;

        const sub = fallbackResult.rows[0] as any;
        return {
          id: sub.id,
          userId: sub.user_id,
          plan: sub.plan,
          status: sub.status,
          storageLimit: 1073741824, // Default 1GB
          storageUsed: 0,
          bandwidthLimit: 10737418240, // Default 10GB
          bandwidthUsed: 0,
          stripeSubscriptionId: sub.stripe_subscription_id,
          stripeCustomerId: sub.stripe_customer_id,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
        } as Subscription;
      } catch (fallbackError: any) {
        logger.warn('Fallback query also failed, returning null', fallbackError);
        return null;
      }
    }
    logger.error('Get active subscription error', error);
    throw error;
  }
});

/**
 * Check if user has platform S3 access
 */
export const hasPlatformAccess = cache(async function hasPlatformAccess(userId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }
  try {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) return false;

    // Only paid plans have platform S3 access
    return subscription.plan !== 'free';
  } catch (error: any) {
    // If database schema is missing columns, return false gracefully
    if (error?.message?.includes('needs migration') || error?.code === '42703') {
      logger.warn('Database schema needs migration. Returning false for platform access.');
      return false;
    }
    throw error;
  }
});

/**
 * Create or update subscription
 */
export async function upsertSubscription(data: NewSubscription): Promise<Subscription> {
  if (!db || !isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }

  try {
    // Check if subscription exists
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, data.userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(subscriptions)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing[0].id))
        .returning();

      return updated[0];
    } else {
      // Create new
      const created = await db
        .insert(subscriptions)
        .values(data)
        .returning();

      return created[0];
    }
  } catch (error) {
    logger.error('Upsert subscription error', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  if (!db || !isDatabaseConfigured()) {
    return false;
  }

  try {
    await db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId));

    return true;
  } catch (error) {
    logger.error('Cancel subscription error', error);
    return false;
  }
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  if (!db || !isDatabaseConfigured()) {
    return null;
  }
  try {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error('Get subscription by user ID error', error);
    return null;
  }
}

/**
 * Create default free tier subscription for new users
 * Default: 1GB storage, 10GB bandwidth
 */
export async function createFreeTierSubscription(userId: string): Promise<Subscription> {
  if (!db || !isDatabaseConfigured()) {
    throw new Error('Database not configured');
  }

  const FREE_STORAGE_LIMIT = 1073741824; // 1GB in bytes
  const FREE_BANDWIDTH_LIMIT = 10737418240; // 10GB in bytes

  const subscription = await upsertSubscription({
    userId,
    plan: 'free',
    status: 'active',
    storageLimit: FREE_STORAGE_LIMIT,
    storageUsed: 0,
    bandwidthLimit: FREE_BANDWIDTH_LIMIT,
    bandwidthUsed: 0,
  });

  return subscription;
}

/**
 * Check if user has enough storage space
 */
export async function checkStorageLimit(userId: string, fileSize: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    // No subscription = no access
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const limit = subscription.storageLimit || 0;
  const used = subscription.storageUsed || 0;
  const remaining = limit - used;

  return {
    allowed: remaining >= fileSize,
    remaining,
    limit,
  };
}

/**
 * Check if user has enough bandwidth
 */
export async function checkBandwidthLimit(userId: string, transferSize: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    // No subscription = no access
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const limit = subscription.bandwidthLimit || 0;
  const used = subscription.bandwidthUsed || 0;
  const remaining = limit - used;

  return {
    allowed: remaining >= transferSize,
    remaining,
    limit,
  };
}

/**
 * Update storage usage (add file size)
 */
export async function incrementStorageUsage(userId: string, fileSize: number): Promise<boolean> {
  if (!db || !isDatabaseConfigured()) {
    return false;
  }

  try {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) return false;

    const newUsed = (subscription.storageUsed || 0) + fileSize;

    await db
      .update(subscriptions)
      .set({
        storageUsed: newUsed,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await deleteCache(`storage-stats:${userId}`);
    await deleteCache(`subscription:${userId}`);

    return true;
  } catch (error) {
    logger.error('Increment storage usage error', error);
    return false;
  }
}

/**
 * Update storage usage (remove file size)
 */
export async function decrementStorageUsage(userId: string, fileSize: number): Promise<boolean> {
  if (!db || !isDatabaseConfigured()) {
    return false;
  }

  try {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) return false;

    const newUsed = Math.max(0, (subscription.storageUsed || 0) - fileSize);

    await db
      .update(subscriptions)
      .set({
        storageUsed: newUsed,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await deleteCache(`storage-stats:${userId}`);
    await deleteCache(`subscription:${userId}`);

    return true;
  } catch (error) {
    logger.error('Decrement storage usage error:', error);
    return false;
  }
}

/**
 * Update bandwidth usage (add transfer size)
 */
export async function incrementBandwidthUsage(userId: string, transferSize: number): Promise<boolean> {
  if (!db || !isDatabaseConfigured()) {
    return false;
  }

  try {
    const subscription = await getActiveSubscription(userId);
    if (!subscription) return false;

    const newUsed = (subscription.bandwidthUsed || 0) + transferSize;

    await db
      .update(subscriptions)
      .set({
        bandwidthUsed: newUsed,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    await deleteCache(`storage-stats:${userId}`);
    await deleteCache(`subscription:${userId}`);

    return true;
  } catch (error) {
    logger.error('Increment bandwidth usage error:', error);
    return false;
  }
}

