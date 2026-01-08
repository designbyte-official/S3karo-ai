import { NextRequest, NextResponse } from 'next/server';

import { verifyUserEmail } from '@/lib/database/queries';
import { apiErrors } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return apiErrors.badRequest('Verification token is required');
    }

    const user = await verifyUserEmail(token);

    if (!user) {
      return apiErrors.badRequest('Invalid or expired verification token');
    }

    return NextResponse.redirect(
      new URL('/sign-in?verified=true', request.url)
    );
  } catch (error: any) {
    logger.error('Verify email error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

