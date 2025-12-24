import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';
import { isDatabaseConfigured } from '@/lib/database/db';

// Check if Platform S3 is configured
const isPlatformS3Configured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// Check if in development mode
const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // In development mode with Platform S3 configured, allow access without subscription
    if (isDevelopment() && isPlatformS3Configured()) {
      return NextResponse.json({
        hasPlatformAccess: true,
        devMode: true,
        message: 'Development mode: Platform S3 enabled without subscription',
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        hasPlatformAccess: false,
        message: 'Database not configured. Platform S3 requires database for subscription management.',
      });
    }

    const access = await hasPlatformAccess(user.id);

    return NextResponse.json({
      hasPlatformAccess: access,
    });
  } catch (error: any) {
    console.error('Check subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

