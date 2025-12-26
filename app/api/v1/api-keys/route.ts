import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { createApiKey, getApiKeysForUser, revokeApiKey } from '@/lib/database/queries';
import { isDatabaseConfigured } from '@/lib/database/db';

/**
 * GET /api/v1/api-keys
 * List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const keys = await getApiKeysForUser(user.id);

    // Return keys without sensitive data
    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/api-keys
 * Create a new API key
 * Body: { name: string, expiresAt?: string, rateLimit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, expiresAt, rateLimit } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Bad request', message: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await createApiKey({
      userId: user.id,
      name: name,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      rateLimit: rateLimit || 1000,
    });

    // IMPORTANT: Return the full key only once
    return NextResponse.json({
      key: result.key, // User must save this - it won't be shown again
      prefix: result.prefix,
      id: result.apiKey.id,
      name: result.apiKey.name,
      expiresAt: result.apiKey.expiresAt?.toISOString() || null,
      rateLimit: Number(result.apiKey.rateLimit),
      createdAt: result.apiKey.createdAt.toISOString(),
      warning: 'Save this API key now. It will not be shown again.',
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/api-keys/:id
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const success = await revokeApiKey(id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Not found', message: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'API key revoked successfully',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

