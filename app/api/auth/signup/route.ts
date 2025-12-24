import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/database/queries';
import { sendVerificationEmail } from '@/lib/email/sender';
import { generateVerificationToken, getVerificationTokenExpiry } from '@/lib/utils/tokens';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, fullName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail signup if email fails - user can request resend later
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
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

