import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey, checkRateLimit, createFile } from '@/lib/database/queries';
import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getFileType } from '@/features/shared/utils';
import { isDatabaseConfigured } from '@/lib/database/db';

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
      return NextResponse.json(
        { error: 'Service unavailable', message: 'Database not configured' },
        { status: 503 }
      );
    }

    // Authenticate via API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid API key. Use: Authorization: Bearer sk_live_...' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    const { userId, apiKey: apiKeyRecord } = authResult;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(apiKeyRecord.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
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
      return NextResponse.json(
        { error: 'Bad request', message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5GB for API uploads)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large', message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB` },
        { status: 400 }
      );
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    // Construct storage key: managed/{userId}/{path}/{timestamp}-{filename}
    const cleanPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const storageKey = `managed/${userId}/${cleanPath}${Date.now()}-${file.name}`;

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
      console.error("S3 Upload Error:", s3Error);
      return NextResponse.json(
        { 
          error: 'Upload failed', 
          message: 'Failed to upload file to storage',
          details: s3Error.message 
        },
        { status: 500 }
      );
    }

    // Generate URL
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${storageKey}`;
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
    return NextResponse.json({
      id: dbFile.id,
      name: dbFile.name,
      url: dbFile.url,
      size: Number(dbFile.size),
      type: dbFile.type,
      extension: dbFile.extension,
      createdAt: dbFile.createdAt.toISOString(),
    }, {
      status: 201,
      headers: {
        'X-RateLimit-Limit': apiKeyRecord.rateLimit.toString(),
        'X-RateLimit-Remaining': (rateLimitCheck.remaining - 1).toString(),
      }
    });

  } catch (error: any) {
    console.error('API upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
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

