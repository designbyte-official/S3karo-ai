import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/database/migrate";

// Run migrations endpoint (for initial setup)
export async function POST() {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: "Migrations completed" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

