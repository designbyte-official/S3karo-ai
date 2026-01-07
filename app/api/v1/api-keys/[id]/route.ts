import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { revokeApiKey } from '@/lib/database/queries';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return apiErrors.unauthorized('Authentication required');
        }

        const { id } = await params;
        const success = await revokeApiKey(id, user.id);

        if (!success) {
            return apiErrors.notFound('API key not found');
        }

        return createSuccessResponse({ message: 'API key revoked successfully' });

    } catch (error: any) {
        logger.error('Revoke API key error', error);
        return apiErrors.internalServerError('Failed to revoke API key', error.message);
    }
}
