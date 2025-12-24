import { NextRequest, NextResponse } from 'next/server';
import { getTotalSpaceUsed } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get total space using Drizzle
    const totalSpace = await getTotalSpaceUsed(user.id);

    return NextResponse.json(totalSpace);
  } catch (error: any) {
    console.error('Get space error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

