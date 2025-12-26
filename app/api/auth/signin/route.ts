import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/database/queries';
import bcrypt from 'bcryptjs';
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (user.emailVerified !== 'true') {
      return NextResponse.json(
        { 
          error: 'Email not verified',
          needsVerification: true,
          message: 'Please verify your email address before signing in. Check your inbox for the verification email.'
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    // JWT_SECRET is validated at module load, so it's guaranteed to be a string here
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    // Set cookie
    (await cookies()).set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

