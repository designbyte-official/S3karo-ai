import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/database/queries';
import { createFreeTierSubscription } from '@/lib/database/queries-subscriptions';
import { sendVerificationEmail } from '@/lib/email/sender';
import { generateVerificationToken, getVerificationTokenExpiry } from '@/lib/utils/tokens';
import { logger } from '@/lib/utils/logger';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
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
      return apiErrors.badRequest('Email, password, and full name are required');
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return apiErrors.badRequest('User with this email already exists');
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

    try {
      await createFreeTierSubscription(user.id);
    } catch (subscriptionError) {
      logger.error('Failed to create free tier subscription', subscriptionError);
    }

    try {
      await sendVerificationEmail(email, verificationToken, fullName);
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError);
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

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    }, 201, "Account created successfully. Please check your email to verify your account.");
  } catch (error: any) {
    logger.error('Signup error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

