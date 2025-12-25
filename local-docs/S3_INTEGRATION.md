# S3-Karo: Service-Based Storage Architecture

This document describes the modern, service-based architecture implemented in S3-Karo. The system provides a unified interface for two distinct storage tiers: **Own S3** and **Managed Storage**.

## Architecture Overview

Instead of using legacy server/client actions, S3-Karo uses a pure service layer that cleanly separates concerns and storage modes.

### 1. Own S3 (Direct Explorer)
- **100% Client-Side**: All S3 operations (list, upload, delete, etc.) happen directly from the browser.
- **Privacy First**: AWS credentials are encrypted and stored locally in the browser. They never touch the S3-Karo servers.
- **Service**: `s3ExplorerService` (consuming `s3CoreService`).

- **Managed Flow**: All operations are routed through the `platformStorageService` which communicates with S3-Karo API endpoints.
- **Pro Gating**: Destructive and modifying operations (Rename, Delete, Share) and Uploads are restricted to Pro users with a subscription. Non-pro users have read-only access + download.
- **Service**: `platformStorageService`.

## Core Services

### `s3CoreService` (`lib/services/s3/s3-core.service.ts`)
The low-level AWS SDK wrapper. Handles bucket listing, object uploading, head requests, and signed URL generation.

### `s3ExplorerService` (`lib/services/s3/s3-explorer.service.ts`)
The high-level explorer logic for "Own S3".
- Emulates folder structure using S3 delimiters.
- Performs client-side searching, sorting, and filtering.
- Maps S3 objects to the unified `File` type.

### `platformStorageService` (`lib/services/platform/platform-storage.service.ts`)
The high-level logic for managed storage.
- Communicates with `/api/files` for database-backed file metadata.
- Handles multi-step uploads (Signed URL -> S3 Put -> DB Registration).
- Manages file sharing and metadata updates.

### `s3ConfigService` (`lib/services/s3/s3-config.service.ts`)
Manages encryption, storage, and retrieval of S3 credentials and the current storage mode preference.

### `s3Utils` (`lib/services/s3/s3-utils.ts`)
Shared utilities for:
- Unique key generation (timestamp + random string).
- Filename sanitization.
- Path parsing and prefix formatting.

## File Unified Type

Both services map their specific data models to a unified `File` interface:
```typescript
export interface File {
  $id: string;        // ID or S3 Key
  id: string;         // Consistent ID
  name: string;       // Filename
  type: string;       // image, video, document, etc.
  extension: string;  // e.g., 'pdf'
  size: number;       // bytes
  url: string;        // Viewable URL
  $createdAt: string; 
  // ... other metadata
}
```

## Security Design

- **Encryption**: Credentials in "Own S3" are encrypted using AES-GCM before storage.
- **Temporary Access**: All file views use S3 Presigned URLs with configurable expirations.
- **Permission Boundary**: Direct S3 access is limited by the IAM credentials provided by the user.

## Developer Note

**NEVER** use `lib/actions` for storage operations. All UI components and hooks must consume the services described above to ensure consistency across storage modes.
