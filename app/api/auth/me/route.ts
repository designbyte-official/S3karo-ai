import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/database/queries';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// SECURITY: JWT_SECRET must be set in environment variables
// Never use default secrets in production - this will throw an error if not set
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '❌ SECURITY ERROR: JWT_SECRET environment variable is not set!\n' +
    'Please set JWT_SECRET in your .env.local file.\n' +
    'Generate a secure secret: openssl rand -base64 32'
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    // JWT_SECRET is validated at module load, so it's guaranteed to be a string here
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET as string);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      accountId: user.id, // For compatibility
      $id: user.id, // For compatibility with existing code
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

