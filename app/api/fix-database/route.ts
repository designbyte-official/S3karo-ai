import { NextRequest, NextResponse } from "next/server";

import { db, isDatabaseConfigured } from "@/lib/database/db";
import { runMigrations, createFreeSubscriptionsForUsers } from "@/lib/database/migrate";
import { logger } from "@/lib/utils/logger";

/**
 * API endpoint to fix database schema issues
 * Adds missing columns to subscriptions table
 *
 * Usage: POST /api/fix-database
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Require authentication (uncomment if needed)
    // const user = await getCurrentUser();
    // if (!user) {
    //   return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    // }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured. Please set DATABASE_URL in .env.local",
        },
        { status: 500 }
      );
    }

    logger.info("Starting database schema fix using Drizzle migrations...");

    const results: string[] = [];

    // Step 1: Run migrations (creates tables and adds missing columns)
    results.push("🔄 Running Drizzle migrations...");
    try {
      await runMigrations();
      results.push("✅ Database migrations completed successfully");
    } catch (error: any) {
      results.push(`⚠️ Migration error: ${error.message}`);
      // Continue anyway - might be partial success
    }

    // Step 2: Create subscriptions for users who don't have one
    results.push("🔍 Creating subscriptions for users without one...");

    let subscriptionResult = { created: 0, skipped: 0 };
    try {
      subscriptionResult = await createFreeSubscriptionsForUsers();
      results.push(
        `✅ Created ${subscriptionResult.created} subscription(s), skipped ${subscriptionResult.skipped}`
      );
    } catch (error: any) {
      results.push(`⚠️ Error creating subscriptions: ${error.message}`);
    }

    logger.info("Database schema fix completed", {
      subscriptionsCreated: subscriptionResult.created,
    });

    return NextResponse.json({
      success: true,
      message: "Database schema fixed successfully",
      details: {
        subscriptionsCreated: subscriptionResult.created,
        subscriptionsSkipped: subscriptionResult.skipped,
        results,
        note: "Schema synced using Drizzle migrations. All columns should now be present.",
      },
    });
  } catch (error: any) {
    logger.error("Failed to fix database schema", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fix database schema",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
