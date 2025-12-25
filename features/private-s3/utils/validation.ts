/**
 * Validation utilities for S3 operations
 */

import { S3ValidationError } from './errors';

// S3 limits
const MAX_FILE_NAME_LENGTH = 1024; // S3 key length limit
const MAX_PATH_LENGTH = 1024; // S3 key total length limit
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB (S3 single upload limit)
const INVALID_CHARACTERS = /[<>:"|?*\x00-\x1f]/; // Invalid characters for S3 keys

/**
 * Validates a file name for S3
 */
export function validateFileName(fileName: string): void {
    if (!fileName || typeof fileName !== 'string') {
        throw new S3ValidationError('File name is required');
    }

    const trimmed = fileName.trim();
    if (!trimmed) {
        throw new S3ValidationError('File name cannot be empty');
    }

    if (trimmed.length > MAX_FILE_NAME_LENGTH) {
        throw new S3ValidationError(`File name is too long (max ${MAX_FILE_NAME_LENGTH} characters)`);
    }

    // Check for invalid characters
    if (INVALID_CHARACTERS.test(trimmed)) {
        throw new S3ValidationError('File name contains invalid characters');
    }

    // Check for reserved names (Windows reserved names)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const upperName = trimmed.toUpperCase();
    if (reservedNames.includes(upperName)) {
        throw new S3ValidationError('File name is a reserved system name');
    }
}

/**
 * Validates a folder/path name for S3
 */
export function validatePath(path: string): void {
    if (path && typeof path === 'string') {
        const trimmed = path.trim();
        
        if (trimmed.length > MAX_PATH_LENGTH) {
            throw new S3ValidationError(`Path is too long (max ${MAX_PATH_LENGTH} characters)`);
        }

        // Check path segments
        const segments = trimmed.split('/').filter(Boolean);
        segments.forEach(segment => {
            if (INVALID_CHARACTERS.test(segment)) {
                throw new S3ValidationError(`Path contains invalid characters: ${segment}`);
            }
        });
    }
}

/**
 * Validates file size
 */
export function validateFileSize(size: number): void {
    if (typeof size !== 'number' || size < 0) {
        throw new S3ValidationError('Invalid file size');
    }

    if (size > MAX_FILE_SIZE) {
        throw new S3ValidationError(`File size exceeds maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB)`);
    }
}

/**
 * Validates S3 configuration
 */
export function validateS3Config(config: any): void {
    if (!config) {
        throw new S3ValidationError('S3 configuration is required');
    }

    if (!config.bucket || typeof config.bucket !== 'string' || !config.bucket.trim()) {
        throw new S3ValidationError('Bucket name is required');
    }

    if (!config.region || typeof config.region !== 'string' || !config.region.trim()) {
        throw new S3ValidationError('Region is required');
    }

    if (!config.accessKeyId || typeof config.accessKeyId !== 'string' || !config.accessKeyId.trim()) {
        throw new S3ValidationError('Access key ID is required');
    }

    if (!config.secretAccessKey || typeof config.secretAccessKey !== 'string' || !config.secretAccessKey.trim()) {
        throw new S3ValidationError('Secret access key is required');
    }

    // Validate bucket name format (basic validation)
    const bucketName = config.bucket.trim();
    if (bucketName.length < 3 || bucketName.length > 63) {
        throw new S3ValidationError('Bucket name must be between 3 and 63 characters');
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(bucketName) && !bucketName.includes('.')) {
        throw new S3ValidationError('Bucket name contains invalid characters');
    }
}

/**
 * Sanitizes a file name for safe S3 storage
 */
export function sanitizeFileName(fileName: string): string {
    if (!fileName) return '';

    // Remove invalid characters
    let sanitized = fileName.replace(INVALID_CHARACTERS, '_');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

    // Replace multiple consecutive dots with single dot
    sanitized = sanitized.replace(/\.{2,}/g, '.');

    // Ensure it's not empty
    if (!sanitized) {
        sanitized = 'file';
    }

    // Truncate if too long (preserve extension)
    if (sanitized.length > MAX_FILE_NAME_LENGTH) {
        const ext = sanitized.substring(sanitized.lastIndexOf('.'));
        const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
        const maxNameLength = MAX_FILE_NAME_LENGTH - ext.length;
        sanitized = nameWithoutExt.substring(0, maxNameLength) + ext;
    }

    return sanitized;
}

/**
 * Normalizes a path for S3 (removes leading/trailing slashes, normalizes separators)
 */
export function normalizePath(path: string): string {
    if (!path) return '';

    // Remove leading and trailing slashes
    let normalized = path.trim().replace(/^\/+|\/+$/g, '');

    // Replace multiple slashes with single slash
    normalized = normalized.replace(/\/+/g, '/');

    return normalized;
}

