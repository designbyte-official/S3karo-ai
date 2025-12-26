import { NextRequest } from 'next/server';
import { verifyApiKey, checkRateLimit, createFile } from '@/lib/database/queries';
import { createPlatformS3Client, getPlatformS3Bucket, getFileUrl } from '@/features/managed-storage/services/platform-s3.service';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getFileType } from '@/features/shared/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { generateStorageKey } from '@/features/managed-storage/utils/storage-key';
import { validateFileName, validateFileSize } from '@/features/private-s3/utils/validation';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

/**
 * Public API Endpoint for File Uploads
 * 
 * Authentication: API Key in Authorization header
 * Format: Authorization: Bearer sk_live_...
 * 
 * POST /api/v1/files
 * Content-Type: multipart/form-data
 * 
 * Body:
 *   - file: File (required)
 *   - path: string (optional) - folder path
 * 
 * Response:
 *   {
 *     "id": "uuid",
 *     "name": "filename.jpg",
 *     "url": "https://...",
 *     "size": 12345,
 *     "type": "image",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    // Check database
    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    // Authenticate via API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiErrors.unauthorized('Missing or invalid API key. Use: Authorization: Bearer sk_live_...');
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult) {
      return apiErrors.unauthorized('Invalid or expired API key');
    }

    const { userId, apiKey: apiKeyRecord } = authResult;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(apiKeyRecord.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too Many Requests', 
          message: `Rate limit exceeded. Limit: ${apiKeyRecord.rateLimit} requests/hour` 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': apiKeyRecord.rateLimit.toString(),
            'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          }
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string | null;

    if (!file) {
      return apiErrors.badRequest('No file provided');
    }

    // Validate file name
    try {
      validateFileName(file.name);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    // Validate file size
    try {
      validateFileSize(file.size);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    // Generate storage key using utility
    const storageKey = generateStorageKey(userId, file.name, path || undefined);

    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
        Metadata: {
          'uploaded-by': 'api',
          'api-key-id': apiKeyRecord.id,
        },
      }));
    } catch (s3Error: any) {
      logger.error('S3 Upload Error', s3Error);
      return apiErrors.internalServerError('Failed to upload file to storage', s3Error.message);
    }

    // Generate URL using CDN
    const url = getFileUrl(storageKey);
    const { type, extension } = getFileType(file.name);

    // Save to database
    const dbFile = await createFile({
      userId: userId,
      name: file.name,
      type: type,
      extension: extension,
      size: file.size,
      url: url,
      storageKey: storageKey,
    });

    // Return response
    return createSuccessResponse({
      id: dbFile.id,
      name: dbFile.name,
      url: dbFile.url,
      size: Number(dbFile.size),
      type: dbFile.type,
      extension: dbFile.extension,
      createdAt: dbFile.createdAt.toISOString(),
    }, 201, undefined, {
      'X-RateLimit-Limit': apiKeyRecord.rateLimit.toString(),
      'X-RateLimit-Remaining': (rateLimitCheck.remaining - 1).toString(),
    });

  } catch (error: any) {
    logger.error('API upload error', error);
    return apiErrors.internalServerError(
      'An unexpected error occurred',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }
}

/**
 * GET /api/v1/files - List files (optional, for API users)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    // TODO: Implement file listing for API users
    return NextResponse.json({
      message: 'File listing not yet implemented',
      files: [],
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

