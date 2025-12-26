import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateVerificationToken } from '@/lib/database/queries';
import { sendVerificationEmail } from '@/lib/email/sender';
import { generateVerificationToken, getVerificationTokenExpiry } from '@/lib/utils/tokens';
import { logger } from '@/lib/utils/logger';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return apiErrors.badRequest('Email is required');
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return createSuccessResponse({
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    if (user.emailVerified === 'true') {
      return apiErrors.badRequest('Email is already verified');
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getVerificationTokenExpiry();

    // Update user with new token
    await updateVerificationToken(user.id, verificationToken, verificationTokenExpiry);

    try {
      await sendVerificationEmail(email, verificationToken, user.fullName);
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError);
      return apiErrors.internalServerError('Failed to send verification email');
    }

    return createSuccessResponse({
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    logger.error('Resend verification error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

