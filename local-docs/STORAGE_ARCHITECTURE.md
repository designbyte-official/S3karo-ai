# Storage Architecture - Private S3 vs Managed Storage

## Overview

S3-Karo supports **two distinct storage modes** with completely different architectures:

### 1. **Private S3** (User's Own Bucket)
- **100% Client-Side**: All operations happen directly from the browser
- **No Database**: Files are NOT stored in the database
- **Privacy First**: AWS credentials stored locally (encrypted in localStorage)
- **Unrestricted**: No Pro subscription required
- **Service**: `s3ExplorerService` → `s3CoreService`

### 2. **Managed Storage** (Platform's Bucket)
- **Server-Side**: All operations go through API routes
- **Database Required**: Files ARE stored in the database
- **Pro Gated**: Upload/Delete/Share require Pro subscription
- **Service**: `platformStorageService` → `/api/files` → Database

---

## Database Schema

### Files Table (ONLY for Managed Storage)

```typescript
files {
  id: UUID
  userId: UUID
  name: string
  type: string
  extension: string
  size: number
  url: string
  storageKey: string      // REQUIRED: S3 key for deletion/access
  bucketName: string       // Optional: Platform bucket name
  sharedWith: string[]     // Array of emails
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Why `storageKey` is Required

**`storageKey` is ESSENTIAL** for Managed Storage because:
1. **Deletion**: We need the S3 key to delete the file from S3 when user deletes it
2. **Signed URLs**: We need it to generate pre-signed URLs for secure access
3. **File Access**: We need it to access the file in the platform's S3 bucket

**Example**: `storageKey = "managed/{userId}/{path}/{timestamp}-{filename}"`

### Why `storageType` Was Removed

**`storageType` was UNNECESSARY** because:
- If a file is in the database → It's automatically Managed Storage
- If a file is NOT in the database → It's automatically Private S3
- No need to store redundant information

---

## How It Works

### Private S3 Flow
```
User uploads file
  ↓
s3ExplorerService.uploadFile()
  ↓
Direct S3 upload (client-side)
  ↓
File appears in list (fetched from S3)
  ↓
NO database interaction
```

### Managed Storage Flow
```
User uploads file
  ↓
POST /api/files
  ↓
Upload to platform's S3 bucket
  ↓
Save metadata to database (with storageKey)
  ↓
File appears in list (fetched from database)
```

---

## Key Differences

| Feature | Private S3 | Managed Storage |
|---------|-----------|----------------|
| **Storage Location** | User's own S3 bucket | Platform's S3 bucket |
| **Database** | ❌ Not used | ✅ Required |
| **storageKey** | ❌ Not needed | ✅ Required (for S3 operations) |
| **Pro Subscription** | ❌ Not required | ✅ Required for uploads |
| **Credentials** | Stored locally (encrypted) | Platform manages |
| **Privacy** | 100% private | Platform has access |

---

## Migration Notes

If you have existing data with `storageType`, you can:
1. Remove the column (it's redundant)
2. All files in the database are Managed Storage by definition
3. Private S3 files were never in the database anyway

