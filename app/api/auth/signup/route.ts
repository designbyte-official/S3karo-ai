import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/database/queries';
import { createFreeTierSubscription } from '@/lib/database/queries-subscriptions';
import { sendVerificationEmail } from '@/lib/email/sender';
import { generateVerificationToken, getVerificationTokenExpiry } from '@/lib/utils/tokens';
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
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();

    // Create user
    const user = await createUser({
      email,
      fullName,
      passwordHash,
      verificationToken,
      verificationTokenExpiry,
    });

    // Create default free tier subscription (1GB storage, 10GB bandwidth)
    try {
      await createFreeTierSubscription(user.id);
    } catch (subscriptionError) {
      console.error("Failed to create free tier subscription:", subscriptionError);
      // Don't fail signup if subscription creation fails - can be created later
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, fullName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup if email fails - user can request resend later
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
      message: "Account created successfully. Please check your email to verify your account.",
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

