import { NextRequest } from 'next/server';
import { getTotalSpaceUsed } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/files/space
 * Get storage space usage by file type
 * @deprecated Use /api/storage/stats instead for comprehensive stats
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    // Get total space using Drizzle
    const totalSpace = await getTotalSpaceUsed(user.id);

    return createSuccessResponse(totalSpace);
  } catch (error: any) {
    logger.error('Get space error', error);
    return apiErrors.internalServerError('Failed to get storage space', error.message);
  }
}

