import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

import jwt from 'jsonwebtoken';

import { getUserById } from '@/lib/database/queries';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

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
      return apiErrors.unauthorized('Not authenticated');
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET as string);
    } catch (error) {
      return apiErrors.unauthorized('Invalid token');
    }

    const user = await getUserById(decoded.userId);

    if (!user) {
      return apiErrors.notFound('User not found');
    }

    return createSuccessResponse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      accountId: user.id,
      $id: user.id,
    });
  } catch (error: any) {
    logger.error('Get user error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

