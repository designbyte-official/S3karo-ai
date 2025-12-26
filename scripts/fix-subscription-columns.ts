#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db, isDatabaseConfigured } from '../lib/database/db';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/utils/logger';

async function fixSubscriptionColumns() {
  if (!isDatabaseConfigured() || !db) {
    logger.error('Database not configured. Please set DATABASE_URL in .env.local');
    process.exit(1);
  }

  try {
    logger.info('Adding missing columns to subscriptions table...');

    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='storage_limit') THEN
          ALTER TABLE subscriptions ADD COLUMN storage_limit BIGINT DEFAULT 1073741824;
          UPDATE subscriptions SET storage_limit = 1073741824 WHERE storage_limit IS NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='storage_used') THEN
          ALTER TABLE subscriptions ADD COLUMN storage_used BIGINT DEFAULT 0;
          UPDATE subscriptions SET storage_used = 0 WHERE storage_used IS NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='bandwidth_limit') THEN
          ALTER TABLE subscriptions ADD COLUMN bandwidth_limit BIGINT DEFAULT 10737418240;
          UPDATE subscriptions SET bandwidth_limit = 10737418240 WHERE bandwidth_limit IS NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='bandwidth_used') THEN
          ALTER TABLE subscriptions ADD COLUMN bandwidth_used BIGINT DEFAULT 0;
          UPDATE subscriptions SET bandwidth_used = 0 WHERE bandwidth_used IS NULL;
        END IF;
      END $$;
    `);

    logger.info('✅ Subscription columns added successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to add subscription columns', error);
    process.exit(1);
  }
}

fixSubscriptionColumns();

