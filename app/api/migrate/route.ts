import { NextResponse } from "next/server";

import { runMigrations, createFreeSubscriptionsForUsers } from "@/lib/database/migrate";

// Run migrations endpoint (for initial setup)
export async function POST() {
  try {
    await runMigrations();

    // Create free subscriptions for users who don't have one
    const subscriptionResult = await createFreeSubscriptionsForUsers();

    return NextResponse.json({
      success: true,
      message: "Migrations completed",
      subscriptions: subscriptionResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
