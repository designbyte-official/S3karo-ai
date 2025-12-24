import { db } from './db';
import { subscriptions } from './schema';
import { eq, and, gte } from 'drizzle-orm';
import type { Subscription, NewSubscription } from './schema';

/**
 * Get active subscription for a user
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  try {
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

    const subscription = result[0];
    
    // Check if subscription is expired
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < new Date()) {
      // Update status to expired
      await db
        .update(subscriptions)
        .set({ status: 'expired' })
        .where(eq(subscriptions.id, subscription.id));
      
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Get active subscription error:', error);
    return null;
  }
}

/**
 * Check if user has platform S3 access
 */
export async function hasPlatformAccess(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) return false;
  
  // Only paid plans have platform S3 access
  return subscription.plan !== 'free';
}

/**
 * Create or update subscription
 */
export async function upsertSubscription(data: NewSubscription): Promise<Subscription> {
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
    console.error('Upsert subscription error:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
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
    console.error('Cancel subscription error:', error);
    return false;
  }
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  try {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Get subscription by user ID error:', error);
    return null;
  }
}

