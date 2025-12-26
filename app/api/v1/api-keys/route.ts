import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { createApiKey, getApiKeysForUser, revokeApiKey } from '@/lib/database/queries';
import { isDatabaseConfigured } from '@/lib/database/db';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    const keys = await getApiKeysForUser(user.id);

    return createSuccessResponse({
      keys: keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        expiresAt: k.expiresAt?.toISOString() || null,
        isActive: k.isActive,
        rateLimit: Number(k.rateLimit),
        createdAt: k.createdAt.toISOString(),
      })),
    });

  } catch (error: any) {
    logger.error('Get API keys error', error);
    return apiErrors.internalServerError('Failed to get API keys', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    const body = await request.json();
    const { name, expiresAt, rateLimit } = body;

    if (!name || typeof name !== 'string') {
      return apiErrors.badRequest('Name is required and must be a string');
    }

    const result = await createApiKey({
      userId: user.id,
      name: name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      rateLimit: rateLimit || 1000,
    });

    return createSuccessResponse({
      key: result.key,
      prefix: result.prefix,
      id: result.apiKey.id,
      name: result.apiKey.name,
      expiresAt: result.apiKey.expiresAt?.toISOString() || null,
      rateLimit: Number(result.apiKey.rateLimit),
      createdAt: result.apiKey.createdAt.toISOString(),
      warning: 'Save this API key now. It will not be shown again.',
    }, 201, 'API key created successfully');

  } catch (error: any) {
    logger.error('Create API key error', error);
    return apiErrors.internalServerError('Failed to create API key', error.message);
  }
}

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

