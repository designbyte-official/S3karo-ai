import { NextRequest, NextResponse } from 'next/server';
import { verifyUserEmail } from '@/lib/database/queries';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify email
    const user = await verifyUserEmail(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Redirect to sign-in with success message
    return NextResponse.redirect(
      new URL('/sign-in?verified=true', request.url)
    );
  } catch (error: any) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

