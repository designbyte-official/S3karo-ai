import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
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

