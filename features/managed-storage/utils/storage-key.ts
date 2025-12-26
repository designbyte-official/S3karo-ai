/**
 * Utilities for generating and validating storage keys for managed storage
 */

import { sanitizeFileName, normalizePath } from '@/features/private-s3/utils/validation';

/**
 * Generates a storage key for managed storage files
 * Format: managed/{userId}/{path}/{timestamp}-{sanitizedFileName}
 */
export function generateStorageKey(
  userId: string,
  fileName: string,
  path?: string
): string {
  // Normalize and sanitize
  const normalizedPath = path ? normalizePath(path) : '';
  const sanitizedName = sanitizeFileName(fileName);
  const timestamp = Date.now();

  // Construct storage key
  if (normalizedPath) {
    return `managed/${userId}/${normalizedPath}/${timestamp}-${sanitizedName}`;
  }
  return `managed/${userId}/${timestamp}-${sanitizedName}`;
}

/**
 * Validates that a storage key belongs to a user
 */
export function validateStorageKeyOwnership(
  storageKey: string,
  userId: string
): boolean {
  return storageKey.startsWith(`managed/${userId}/`);
}

/**
 * Extracts the original file name from a storage key
 * (removes timestamp prefix)
 */
export function extractFileNameFromKey(storageKey: string): string {
  const parts = storageKey.split('/');
  const fileNameWithTimestamp = parts[parts.length - 1];
  // Remove timestamp prefix (format: timestamp-filename)
  const match = fileNameWithTimestamp.match(/^\d+-(.+)$/);
  return match ? match[1] : fileNameWithTimestamp;
}

