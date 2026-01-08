import { sql, eq } from "drizzle-orm";

import { logger } from "@/lib/utils/logger";

import { db, isDatabaseConfigured } from "./db";
import { createFreeTierSubscription } from "./queries-subscriptions";
import { users, subscriptions } from "./schema";

// Run this to create tables if they don't exist
export async function runMigrations() {
  if (!db) {
    throw new Error("Database not configured");
  }
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        avatar TEXT DEFAULT 'https://ui-avatars.com/api/?name=User&background=random',
        password_hash TEXT NOT NULL,
        email_verified TEXT DEFAULT 'false',
        verification_token TEXT,
        verification_token_expiry TIMESTAMP WITH TIME ZONE,
        is_pro BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Add user columns if they don't exist (for existing databases)
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
          ALTER TABLE users ADD COLUMN email_verified TEXT DEFAULT 'false';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_token') THEN
          ALTER TABLE users ADD COLUMN verification_token TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_token_expiry') THEN
          ALTER TABLE users ADD COLUMN verification_token_expiry TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_pro') THEN
          ALTER TABLE users ADD COLUMN is_pro BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // Create subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        storage_limit BIGINT DEFAULT 1073741824,
        storage_used BIGINT DEFAULT 0,
        bandwidth_limit BIGINT DEFAULT 10737418240,
        bandwidth_used BIGINT DEFAULT 0,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Add columns if they don't exist (for existing databases)
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='storage_limit') THEN
          ALTER TABLE subscriptions ADD COLUMN storage_limit BIGINT DEFAULT 1073741824;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='storage_used') THEN
          ALTER TABLE subscriptions ADD COLUMN storage_used BIGINT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='bandwidth_limit') THEN
          ALTER TABLE subscriptions ADD COLUMN bandwidth_limit BIGINT DEFAULT 10737418240;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='bandwidth_used') THEN
          ALTER TABLE subscriptions ADD COLUMN bandwidth_used BIGINT DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
          ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_customer_id') THEN
          ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
          ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
          ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='cancel_at_period_end') THEN
          ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);

    // Create files table
    // NOTE: This table is ONLY for Managed Storage files (platform-managed S3)
    // Private S3 files are NOT stored here - they're managed client-side only
    // bucket_name is NOT stored - always use getPlatformS3Bucket() from env
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        extension TEXT NOT NULL,
        size BIGINT NOT NULL,
        url TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        shared_with JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create API keys table - for external API access
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        prefix TEXT NOT NULL,
        last_used_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        rate_limit BIGINT DEFAULT 1000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_files_type ON files(type)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)
    `);

    // Create update trigger function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // Create triggers
    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_files_updated_at ON files;
      CREATE TRIGGER update_files_updated_at 
      BEFORE UPDATE ON files
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
      CREATE TRIGGER update_subscriptions_updated_at 
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
      CREATE TRIGGER update_api_keys_updated_at 
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // Create indexes for API keys
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)
    `);

    logger.info("Database migrations completed successfully");
    return true;
  } catch (error) {
    logger.error("Migration error", error);
    throw error;
  }
}

/**
 * Create free subscriptions for users who don't have one
 */
export async function createFreeSubscriptionsForUsers() {
  if (!db || !isDatabaseConfigured()) {
    logger.warn("Database not configured, skipping free subscription creation");
    return { created: 0, skipped: 0 };
  }
  try {
    // Get all users
    const allUsers = await db.select().from(users);

    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      // Check if user has any subscription
      const existingSubscriptions = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1);

      if (existingSubscriptions.length === 0) {
        // User has no subscription, create free tier
        try {
          await createFreeTierSubscription(user.id);
          created++;
          logger.info(`Created free subscription for user ${user.id}`);
        } catch (error) {
          logger.error(`Failed to create free subscription for user ${user.id}`, error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    logger.info(`Free subscription migration completed: ${created} created, ${skipped} skipped`);
    return { created, skipped };
  } catch (error) {
    logger.error("Create free subscriptions error", error);
    throw error;
  }
}

