# S3-Karo Architecture

## Overview

S3-Karo is a dual-mode storage platform that supports:
1. **Private S3**: Users connect their own S3 buckets (100% client-side, no database)
2. **Managed Storage**: Platform-managed S3 with API access (server-side, database required)

## Architecture Principles

### 1. Separation of Concerns
- **Private S3**: Zero server-side storage, all operations client-side
- **Managed Storage**: Full server-side control with database tracking

### 2. Data Minimization
- Only store what's **absolutely necessary**
- `bucketName`: ❌ Removed (always from env var)
- `storageType`: ❌ Removed (inferred from context)
- `storageKey`: ✅ Required (for S3 operations)

### 3. Security First
- API keys: Hashed with SHA-256 (never store plain text)
- Rate limiting: Per API key
- Authentication: Bearer token in Authorization header

## Database Schema

### Files Table (Managed Storage Only)

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  extension TEXT NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  storage_key TEXT NOT NULL,  -- REQUIRED: S3 key for operations
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

**Why `storageKey` is Required:**
- Delete files from S3 when user deletes them
- Generate pre-signed URLs for secure access
- Access files in the platform's S3 bucket

**Why `bucketName` was Removed:**
- Always use `getPlatformS3Bucket()` from environment variable
- Redundant to store per file
- Single bucket per platform instance

### API Keys Table

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of API key
  prefix TEXT NOT NULL,            -- First 8 chars for display
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  rate_limit BIGINT DEFAULT 1000,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

## Storage Key Format

```
managed/{userId}/{path}/{timestamp}-{filename}
```

Example:
```
managed/123e4567-e89b-12d3-a456-426614174000/documents/2024/1704067200000-report.pdf
```

**Benefits:**
- Organized by user
- Supports folder structure
- Timestamp prevents collisions
- Easy to identify and manage

## API Architecture

### Endpoints

#### Public API (`/api/v1/*`)
- **POST** `/api/v1/files` - Upload file
- **DELETE** `/api/v1/files/:id` - Delete file
- **GET** `/api/v1/files` - List files (coming soon)

#### Internal API (`/api/*`)
- **POST** `/api/files` - Internal file upload (web UI)
- **GET** `/api/files` - Internal file listing
- **POST** `/api/v1/api-keys` - Create API key
- **GET** `/api/v1/api-keys` - List API keys
- **DELETE** `/api/v1/api-keys/:id` - Revoke API key

### Authentication Flow

```
1. User creates API key → Stored as SHA-256 hash
2. User makes request → Includes API key in Authorization header
3. Server verifies → Hashes provided key, compares with stored hash
4. Server checks → Expiration, active status, rate limits
5. Server processes → Request if all checks pass
```

### Rate Limiting

**Current Implementation:**
- Per API key rate limit
- Default: 1,000 requests/hour
- Custom limits for Pro users

**Future Improvements:**
- Redis-based rate limiting
- Sliding window algorithm
- Per-endpoint limits
- Burst allowance

## File Upload Flow

### Managed Storage (Web UI) - Direct Upload Architecture

```
User uploads file
  ↓
POST /api/upload (request presigned URL)
  ↓
Validate Pro subscription & file constraints
  ↓
Return presigned URL to client
  ↓
Client uploads directly to S3 (bypasses server)
  ↓
POST /api/upload/callback (save metadata)
  ↓
Save metadata to database (with storageKey)
  ↓
Return file info
```

**Benefits:**
- No server buffering (files never pass through server)
- Faster uploads, especially for large files
- Lower server load and memory usage
- Better scalability

### Managed Storage (Public API)

```
External app uploads file
  ↓
POST /api/v1/files (authenticated via API key)
  ↓
Verify API key (hash comparison)
  ↓
Check rate limit
  ↓
Upload to S3 (platform bucket)
  ↓
Save metadata to database (with storageKey)
  ↓
Return file info
```

### Private S3

```
User uploads file
  ↓
s3ExplorerService.uploadFile() (client-side)
  ↓
Direct S3 upload (user's bucket)
  ↓
File appears in list (fetched from S3)
  ↓
NO database interaction
```

## Error Handling

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable message",
  "details": "Additional details (dev only)"
}
```

### Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Invalid/missing API key
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error
- `503`: Service Unavailable - Service down

## Security Best Practices

1. **API Keys**
   - Never store plain text
   - Hash with SHA-256
   - Show only once on creation
   - Support expiration

2. **File Access**
   - Use pre-signed URLs for temporary access
   - Validate user ownership before operations
   - Implement CORS policies

3. **Rate Limiting**
   - Per API key limits
   - Per IP limits (future)
   - Burst protection

4. **Input Validation**
   - File size limits (5GB max)
   - File type validation
   - Path sanitization

## Performance Optimizations

1. **Database**
   - Indexed queries (user_id, storage_key, type)
   - Efficient pagination
   - Connection pooling

2. **S3 Operations**
   - Direct uploads (no server buffering)
   - Multipart uploads for large files (>100MB)
   - Parallel uploads

3. **Caching**
   - API key verification cache (future)
   - File metadata cache (future)
   - Rate limit counters (future)

## Scalability Considerations

1. **Database**
   - Partition files table by user_id (future)
   - Archive old files (future)
   - Read replicas for queries (future)

2. **S3**
   - Multi-region support (future)
   - CDN integration (future)
   - Lifecycle policies (future)

3. **API**
   - Load balancing
   - Horizontal scaling
   - Redis for rate limiting

## Monitoring & Observability

**Metrics to Track:**
- API request rate
- Upload success/failure rate
- File size distribution
- Storage usage per user
- API key usage patterns
- Error rates by endpoint

**Logging:**
- All API requests
- S3 operation failures
- Authentication failures
- Rate limit violations

## Future Enhancements

1. **Multipart Upload API**
   - Support for files >5GB
   - Resumable uploads
   - Progress tracking

2. **Webhooks**
   - File upload notifications
   - Deletion notifications
   - Error notifications

3. **Advanced Features**
   - File versioning
   - File sharing via API
   - Batch operations
   - File transformations

4. **SDKs**
   - Official JavaScript SDK
   - Official Python SDK
   - Official Go SDK

