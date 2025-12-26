import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { getUserById, updateUser } from '@/lib/database/queries';
import { apiErrors } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/users/me
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    // Get full user from database to include isPro
    const fullUser = await getUserById(user.id);
    
    if (!fullUser) {
      return apiErrors.notFound('User not found');
    }

    return NextResponse.json({
      id: fullUser.id,
      email: fullUser.email,
      fullName: fullUser.fullName,
      avatar: fullUser.avatar,
      isPro: fullUser.isPro || false,
    });
  } catch (error: any) {
    logger.error('Get user profile error', error);
    return apiErrors.internalServerError('Failed to get user profile', error.message);
  }
}

/**
 * PATCH /api/users/me
 * Update current user profile
 * 
 * Body: {
 *   fullName?: string,
 *   avatar?: string,
 *   isPro?: boolean,
 *   ...other user fields
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    const body = await request.json();
    
    // Allowed fields for update
    const allowedFields = ['fullName', 'avatar', 'isPro'] as const;

    // Filter to only allowed fields
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return apiErrors.badRequest('No valid fields to update');
    }

    // Update user
    const updatedUser = await updateUser(user.id, updateData);

    if (!updatedUser) {
      return apiErrors.notFound('User not found');
    }

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatar: updatedUser.avatar,
      isPro: updatedUser.isPro || false,
    });
  } catch (error: any) {
    logger.error('Update user profile error', error);
    return apiErrors.internalServerError('Failed to update user profile', error.message);
  }
}

