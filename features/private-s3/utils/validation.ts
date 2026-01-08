import { S3ValidationError } from "./errors";

const MAX_FILE_NAME_LENGTH = 1024;
const MAX_PATH_LENGTH = 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;
// eslint-disable-next-line no-control-regex
const INVALID_CHARACTERS = /[<>:"|?*\x00-\x1f]/;

// Validate file name for S3
export function validateFileName(fileName: string): void {
  if (!fileName || typeof fileName !== "string") {
    throw new S3ValidationError("File name is required");
  }

  const trimmed = fileName.trim();
  if (!trimmed) {
    throw new S3ValidationError("File name cannot be empty");
  }

  if (trimmed.length > MAX_FILE_NAME_LENGTH) {
    throw new S3ValidationError(`File name is too long (max ${MAX_FILE_NAME_LENGTH} characters)`);
  }

  if (INVALID_CHARACTERS.test(trimmed)) {
    throw new S3ValidationError("File name contains invalid characters");
  }

  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  const upperName = trimmed.toUpperCase();
  if (reservedNames.includes(upperName)) {
    throw new S3ValidationError("File name is a reserved system name");
  }
}

// Validate folder path for S3
export function validatePath(path: string): void {
  if (path && typeof path === "string") {
    const trimmed = path.trim();

    if (trimmed.length > MAX_PATH_LENGTH) {
      throw new S3ValidationError(`Path is too long (max ${MAX_PATH_LENGTH} characters)`);
    }

    const segments = trimmed.split("/").filter(Boolean);
    segments.forEach((segment) => {
      if (INVALID_CHARACTERS.test(segment)) {
        throw new S3ValidationError(`Path contains invalid characters: ${segment}`);
      }
    });
  }
}

// Validate file size
export function validateFileSize(size: number): void {
  if (typeof size !== "number" || size < 0) {
    throw new S3ValidationError("Invalid file size");
  }

  if (size > MAX_FILE_SIZE) {
    throw new S3ValidationError(
      `File size exceeds maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB)`
    );
  }
}

interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// Validate S3 configuration
export function validateS3Config(config: S3Config): void {
  if (!config) {
    throw new S3ValidationError("S3 configuration is required");
  }

  if (!config.bucket || typeof config.bucket !== "string" || !config.bucket.trim()) {
    throw new S3ValidationError("Bucket name is required");
  }

  if (!config.region || typeof config.region !== "string" || !config.region.trim()) {
    throw new S3ValidationError("Region is required");
  }

  if (!config.accessKeyId || typeof config.accessKeyId !== "string" || !config.accessKeyId.trim()) {
    throw new S3ValidationError("Access key ID is required");
  }

  if (
    !config.secretAccessKey ||
    typeof config.secretAccessKey !== "string" ||
    !config.secretAccessKey.trim()
  ) {
    throw new S3ValidationError("Secret access key is required");
  }

  const bucketName = config.bucket.trim();
  if (bucketName.length < 3 || bucketName.length > 63) {
    throw new S3ValidationError("Bucket name must be between 3 and 63 characters");
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(bucketName) && !bucketName.includes(".")) {
    throw new S3ValidationError("Bucket name contains invalid characters");
  }
}

// Clean file name for safe S3 storage
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "";

  let sanitized = fileName.replace(INVALID_CHARACTERS, "_");
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");
  sanitized = sanitized.replace(/\.{2,}/g, ".");

  if (!sanitized) {
    sanitized = "file";
  }

  if (sanitized.length > MAX_FILE_NAME_LENGTH) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."));
    const maxNameLength = MAX_FILE_NAME_LENGTH - ext.length;
    sanitized = nameWithoutExt.substring(0, maxNameLength) + ext;
  }

  return sanitized;
}

// Normalize path (remove slashes, etc)
export function normalizePath(path: string): string {
  if (!path) return "";

  let normalized = path.trim().replace(/^\/+|\/+$/g, "");
  normalized = normalized.replace(/\/+/g, "/");

  return normalized;
}
