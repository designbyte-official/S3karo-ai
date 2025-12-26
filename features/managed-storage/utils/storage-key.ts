import { sanitizeFileName, normalizePath } from '@/features/private-s3/utils/validation';

// Generate storage key for managed files
export function generateStorageKey(
  userId: string,
  fileName: string,
  path?: string
): string {
  const normalizedPath = path ? normalizePath(path) : '';
  const sanitizedName = sanitizeFileName(fileName);
  const timestamp = Date.now();

  if (normalizedPath) {
    return `managed/${userId}/${normalizedPath}/${timestamp}-${sanitizedName}`;
  }
  return `managed/${userId}/${timestamp}-${sanitizedName}`;
}

// Check if storage key belongs to user
export function validateStorageKeyOwnership(
  storageKey: string,
  userId: string
): boolean {
  return storageKey.startsWith(`managed/${userId}/`);
}

// Extract original filename from storage key
export function extractFileNameFromKey(storageKey: string): string {
  const parts = storageKey.split('/');
  const fileNameWithTimestamp = parts[parts.length - 1];
  const match = fileNameWithTimestamp.match(/^\d+-(.+)$/);
  return match ? match[1] : fileNameWithTimestamp;
}

