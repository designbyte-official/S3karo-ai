import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/database/db';

export async function GET(request: NextRequest) {
  try {
    const configured = isDatabaseConfigured();
    
    return NextResponse.json({
      configured,
      message: configured 
        ? 'Database is configured and ready' 
        : 'Database is not configured. Add DATABASE_URL to .env.local',
    });
  } catch (error: any) {
    console.error('Database status check error:', error);
    return NextResponse.json(
      { configured: false, error: error.message },
      { status: 500 }
    );
  }
}

