import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';
import { isDatabaseConfigured } from '@/lib/database/db';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    // Check if database is configured
    if (!isDatabaseConfigured()) {
      return createSuccessResponse({
        hasPlatformAccess: false,
        message: 'Database not configured. Platform S3 requires database for subscription management.',
      });
    }

    const access = await hasPlatformAccess(user.id);

    return createSuccessResponse({
      hasPlatformAccess: access,
    });
  } catch (error: any) {
    logger.error('Check subscription error', error);
    return apiErrors.internalServerError('Failed to check subscription', error.message);
  }
}

