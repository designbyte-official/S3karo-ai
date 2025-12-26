# S3-Karo Upload Architecture

## Overview

S3-Karo uses industry best practices for file uploads (inspired by modern upload services), providing:
- **Direct client-to-S3 uploads** via presigned URLs
- **Reduced server load** - files never pass through the server
- **Better performance** - faster uploads, especially for large files
- **File routes with middleware** - configurable validation
- **React hooks and components** - easy integration

## Architecture Flow

### Traditional Upload (Old)
```
Client → Server → S3 → Server → Database
```
**Problems:**
- Server buffers entire file
- High memory usage
- Slow for large files
- Server becomes bottleneck

### S3-Karo Direct Upload (New)
```
1. Client → Server: Request presigned URL
2. Client → S3: Upload directly using presigned URL
3. Client → Server: Callback to save metadata
```
**Benefits:**
- No server buffering
- Lower memory usage
- Faster uploads
- Scalable architecture

## API Endpoints

### 1. Request Presigned URL

**POST** `/api/upload`

Request a presigned URL for direct S3 upload.

**Request:**
```json
{
  "fileName": "example.jpg",
  "fileType": "image/jpeg",
  "fileSize": 12345,
  "path": "documents/2024/",
  "route": {
    "maxFileSize": 5242880,
    "allowedFileTypes": ["image/*", "application/pdf"]
  }
}
```

**Response:**
```json
{
  "url": "https://bucket.s3.amazonaws.com/...?signature=...",
  "key": "managed/userId/path/timestamp-filename.jpg",
  "expiresIn": 3600,
  "metadata": {
    "fileName": "example.jpg",
    "fileType": "image/jpeg",
    "fileSize": 12345,
    "path": "documents/2024/"
  }
}
```

### 2. Upload Callback

**POST** `/api/upload/callback`

Save file metadata after successful S3 upload.

**Request:**
```json
{
  "key": "managed/userId/path/timestamp-filename.jpg",
  "fileName": "example.jpg",
  "fileType": "image/jpeg",
  "fileSize": 12345,
  "path": "documents/2024/"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "example.jpg",
  "url": "https://bucket.s3.amazonaws.com/...",
  "size": 12345,
  "type": "image",
  "extension": ".jpg",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## React Integration

### Hook: `useUpload`

```typescript
import { useUpload } from '@/features/managed-storage/hooks/use-upload';

function MyComponent() {
  const { upload, uploadMultiple, isUploading, uploadProgress } = useUpload();

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file, {
        path: 'documents/2024/',
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*', 'application/pdf'],
        onUploadProgress: (progress) => {
          console.log(`Upload progress: ${progress}%`);
        },
        onSuccess: (file) => {
          console.log('Uploaded:', file);
        },
        onError: (error) => {
          console.error('Upload failed:', error);
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div>
      {isUploading && <p>Uploading... {uploadProgress}%</p>}
      <input type="file" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
    </div>
  );
}
```

### Component: `UploadButton`

```typescript
import { UploadButton } from '@/components/common/UploadButton';

function MyComponent() {
  return (
    <UploadButton
      path="documents/2024/"
      maxFileSize={10 * 1024 * 1024}
      allowedFileTypes={['image/*', 'application/pdf']}
      onUploadComplete={(files) => {
        console.log('Uploaded files:', files);
      }}
    >
      Upload Files
    </UploadButton>
  );
}
```

## File Routes & Middleware

File routes define validation rules for uploads:

```typescript
interface FileRouteConfig {
  maxFileSize?: number;        // Max file size in bytes
  allowedFileTypes?: string[];  // MIME types (e.g., ['image/*', 'application/pdf'])
  maxFileCount?: number;       // Max files per upload
}
```

**Examples:**

```typescript
// Images only, max 5MB
{
  maxFileSize: 5 * 1024 * 1024,
  allowedFileTypes: ['image/*']
}

// Documents only, max 10MB
{
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ['application/pdf', 'application/msword']
}

// All types, max 5GB
{
  maxFileSize: 5 * 1024 * 1024 * 1024,
  allowedFileTypes: ['*']
}
```

## Security

### Authentication
- All endpoints require user authentication
- Pro subscription required for managed storage
- API keys supported for external access

### Validation
- File size limits enforced
- File type validation
- Path sanitization
- Storage key verification

### Presigned URLs
- Expire after 1 hour
- Scoped to specific S3 key
- Include content type
- Metadata for tracking

## Migration from Old Upload

### Old Way (Server Buffering)
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/files', {
  method: 'POST',
  body: formData,
});
```

### New Way (Direct Upload)
```typescript
const { upload } = useUpload();

await upload(file, {
  path: 'documents/',
  onSuccess: (result) => {
    console.log('Uploaded:', result);
  },
});
```

## Benefits

1. **Performance**
   - Faster uploads (no server bottleneck)
   - Lower latency
   - Better for large files

2. **Scalability**
   - Server doesn't handle file data
   - Reduced memory usage
   - Can handle more concurrent uploads

3. **Cost**
   - Less server bandwidth
   - Lower server costs
   - Direct S3 uploads

4. **Developer Experience**
   - Simple React hooks
   - Easy-to-use components
   - TypeScript support
   - Progress tracking

## Features

| Feature | S3-Karo |
|---------|---------|
| Presigned URLs | ✅ |
| File Routes | ✅ |
| React Hooks | ✅ |
| Direct S3 Upload | ✅ |
| Callback System | ✅ |
| Multiple Storage | ✅ (Private + Managed) |
| API Keys | ✅ |
| Rate Limiting | ✅ |

## Next Steps

1. **Multipart Uploads**
   - Support for files >5GB
   - Resumable uploads
   - Progress tracking per chunk

2. **Webhooks**
   - File upload notifications
   - Error notifications
   - Custom callbacks

3. **Advanced Features**
   - Image transformations
   - Video processing
   - File compression

4. **SDKs**
   - Official JavaScript SDK
   - Official React SDK
   - Official Node.js SDK

