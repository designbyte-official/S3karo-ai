import { S3File as File } from "@/types/file";
import { S3Config, S3_CONFIG_KEY } from "./s3-config.service";
import { getFileType } from "@/features/shared/utils";
import {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    ListObjectsV2CommandOutput
} from "@aws-sdk/client-s3";
import { handleS3Error, S3Error } from "../utils/errors";
import { validateFileName, validatePath, validateFileSize, validateS3Config, sanitizeFileName, normalizePath } from "../utils/validation";
import { withRetry } from "../utils/retry";

/**
 * Normalizes a base URL to always end with a trailing slash
 * Handles edge cases: empty strings, null, undefined, URLs with/without trailing slashes
 */
const normalizeBaseUrl = (url: string | undefined | null): string => {
    if (!url || typeof url !== 'string') return '';
    
    // Remove any whitespace
    let normalized = url.trim();
    
    // Remove trailing slashes first
    normalized = normalized.replace(/\/+$/, '');
    
    // Add single trailing slash
    return normalized ? `${normalized}/` : '';
};

/**
 * Encodes a file key/path for use in URLs
 * Properly handles special characters, spaces, and edge cases
 */
const encodeFileKey = (key: string | undefined | null): string => {
    if (!key || typeof key !== 'string') return '';
    
    // Trim whitespace
    const trimmed = key.trim();
    if (!trimmed) return '';
    
    // Split by '/' to encode each segment separately (preserve path structure)
    const segments = trimmed.split('/');
    const encodedSegments = segments.map((segment, index) => {
        // Preserve empty segments only if they're not at the start/end (for proper path handling)
        if (!segment && (index === 0 || index === segments.length - 1)) {
            return '';
        }
        if (!segment) {
            return segment; // Preserve empty segments in the middle (double slashes)
        }
        // Encode each segment, but preserve '/' separators
        // Handle edge cases: already encoded segments, special characters
        try {
            return encodeURIComponent(segment);
        } catch (e) {
            // Fallback for invalid characters
            console.warn('Failed to encode segment:', segment);
            return segment.replace(/[^a-zA-Z0-9._-]/g, encodeURIComponent);
        }
    });
    
    // Filter out empty segments at start/end, but preserve structure
    const result = encodedSegments.join('/');
    return result;
};

/**
 * Constructs a complete file URL with proper encoding and normalization
 * Handles edge cases: empty keys, malformed URLs, special characters
 */
const constructFileUrl = (baseUrl: string, fileKey: string): string => {
    // Edge case: empty base URL or file key
    if (!baseUrl || !fileKey) {
        console.warn('constructFileUrl: Missing baseUrl or fileKey', { baseUrl, fileKey });
        return '';
    }
    
    try {
        const normalizedBase = normalizeBaseUrl(baseUrl);
        if (!normalizedBase) {
            console.warn('constructFileUrl: Failed to normalize base URL', baseUrl);
            return '';
        }
        
        const encodedKey = encodeFileKey(fileKey);
        if (!encodedKey) {
            console.warn('constructFileUrl: Failed to encode file key', fileKey);
            return '';
        }
        
        // Remove leading slash from encoded key if base URL already has trailing slash
        const cleanKey = encodedKey.startsWith('/') ? encodedKey.slice(1) : encodedKey;
        
        // Final validation: ensure the constructed URL is valid
        const finalUrl = `${normalizedBase}${cleanKey}`;
        
        // Basic URL validation
        try {
            new URL(finalUrl);
            return finalUrl;
        } catch (e) {
            console.warn('constructFileUrl: Invalid URL constructed', finalUrl);
            return finalUrl; // Return anyway, let the browser handle it
        }
    } catch (error) {
        console.error('constructFileUrl: Error constructing URL', { baseUrl, fileKey, error });
        return '';
    }
};

/**
 * Creates an S3 client with validated configuration
 * IMPORTANT: Only use 'endpoint' for S3 API operations (e.g., MinIO)
 * NEVER use 'cdnUrl' here - it's only for viewing files, not API operations
 */
const getS3Client = (config: S3Config): S3Client => {
    // Validate config before creating client
    validateS3Config(config);
    
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
        endpoint: config.endpoint || undefined, // Only S3 API endpoint, NOT cdnUrl
        forcePathStyle: !!config.endpoint, // Needed for MinIO/Custom endpoints
        // Add request timeout
        requestHandler: {
            requestTimeout: 30000, // 30 seconds
        },
    });
};

export const s3ExplorerService = {
    /**
     * Lists items in S3 bucket with validation and error handling
     */
    async listItems(params: {
        config: S3Config;
        ownerId: string;
        accountId: string;
        subPath?: string;
        searchText?: string;
        sort?: string;
        limit?: number;
        continuationToken?: string;
    }): Promise<{ documents: File[]; total: number; continuationToken?: string }> {
        // Validate inputs
        if (params.subPath) {
            validatePath(params.subPath);
        }

        return withRetry(async () => {
            const client = getS3Client(params.config);

            // Normalize and validate path
            const normalizedPath = params.subPath ? normalizePath(params.subPath) : "";
            const prefix = normalizedPath ? `${normalizedPath}/` : "";

            try {
                const command = new ListObjectsV2Command({
                    Bucket: params.config.bucket,
                    Prefix: params.searchText ? "" : prefix, // Recursive search from root if searchText
                    Delimiter: params.searchText ? undefined : "/",
                    MaxKeys: params.limit || 1000, // Default limit
                    ContinuationToken: params.continuationToken,
                });

                const response: ListObjectsV2CommandOutput = await client.send(command);

            const files: File[] = [];

            // Process Folders (CommonPrefixes)
            if (response.CommonPrefixes && !params.searchText) {
                response.CommonPrefixes.forEach((p) => {
                    const name = p.Prefix!.replace(prefix, "").replace("/", "");
                    if (!name) return;

                    files.push({
                        $id: p.Prefix!,
                        bucketFileId: p.Prefix!,
                        name: name,
                        type: "folder",
                        size: 0,
                        extension: "folder",
                        url: "",
                        users: [],
                        accountId: params.accountId,
                        owner: {
                            $id: params.ownerId,
                            fullName: "Me",
                        },
                        $createdAt: new Date().toISOString(),
                        $updatedAt: new Date().toISOString(),
                    });
                });
            }

            // Process Files (Contents)
            if (response.Contents) {
                response.Contents.forEach((item) => {
                    if (item.Key === prefix || !item.Key) return;

                    const name = item.Key.split('/').pop() || "";
                    if (!name) return;

                    const { type, extension } = getFileType(name);

                    // Use cdnUrl for viewing files if available, otherwise use endpoint or default S3 URL
                    // cdnUrl is for CloudFront/CDN (viewing only), endpoint is for S3 API operations
                    let baseUrl: string;
                    if (params.config.cdnUrl) {
                        // CloudFront/CDN URL for viewing files
                        baseUrl = normalizeBaseUrl(params.config.cdnUrl);
                    } else if (params.config.endpoint) {
                        // Custom S3 endpoint (e.g., MinIO) for viewing
                        baseUrl = normalizeBaseUrl(params.config.endpoint);
                    } else {
                        // Default AWS S3 URL
                        baseUrl = normalizeBaseUrl(`https://${params.config.bucket}.s3.${params.config.region}.amazonaws.com`);
                    }

                    // Construct URL with proper encoding and normalization
                    const url = constructFileUrl(baseUrl, item.Key || '');

                    files.push({
                        $id: item.Key!,
                        bucketFileId: item.Key!,
                        name: name,
                        type: type,
                        size: item.Size || 0,
                        extension: extension,
                        url: url,
                        users: [],
                        accountId: params.accountId,
                        owner: {
                            $id: params.ownerId,
                            fullName: "Me",
                        },
                        $createdAt: item.LastModified?.toISOString() || new Date().toISOString(),
                        $updatedAt: new Date().toISOString(),
                    });
                });
            }

                let resultFiles = files;
                if (params.searchText) {
                    const lowerQuery = params.searchText.toLowerCase().trim();
                    resultFiles = resultFiles.filter(f => f.name.toLowerCase().includes(lowerQuery));
                }

                // Apply sorting if provided
                if (params.sort) {
                    const [sortBy, order] = params.sort.split('-');
                    const orderMultiplier = order === 'asc' ? 1 : -1;
                    
                    resultFiles.sort((a, b) => {
                        let comparison = 0;
                        switch (sortBy) {
                            case 'name':
                                comparison = a.name.localeCompare(b.name);
                                break;
                            case 'size':
                                comparison = a.size - b.size;
                                break;
                            case '$createdAt':
                            default:
                                comparison = new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime();
                                break;
                        }
                        return comparison * orderMultiplier;
                    });
                }

                return {
                    documents: resultFiles,
                    total: resultFiles.length,
                    continuationToken: response.NextContinuationToken,
                };
            } catch (error) {
                throw handleS3Error(error, 'List files');
            }
        }, {
            maxRetries: 2, // Fewer retries for list operations
        });
    },

    /**
     * Gets bucket statistics with error handling
     */
    async getBucketStats(config: S3Config, prefix: string = "") {
        if (prefix) {
            validatePath(prefix);
        }

        return withRetry(async () => {
            const client = getS3Client(config);
            
            try {
                const normalizedPrefix = prefix ? normalizePath(prefix) : "";
                const command = new ListObjectsV2Command({
                    Bucket: config.bucket,
                    Prefix: normalizedPrefix ? `${normalizedPrefix}/` : "",
                });
                const response = await client.send(command);

                let totalSize = 0;
                let fileCount = 0;
                
                if (response.Contents) {
                    totalSize = response.Contents.reduce((acc, item) => {
                        if (item.Size) {
                            fileCount++;
                            return acc + item.Size;
                        }
                        return acc;
                    }, 0);
                }

                return {
                    used: totalSize,
                    fileCount,
                    all: undefined, // Total bucket capacity is usually not available via API
                };
            } catch (error) {
                throw handleS3Error(error, 'Get bucket stats');
            }
        });
    },

    /**
     * Uploads a file to S3 with validation and error handling
     */
    async uploadFile(params: {
        config: S3Config;
        file: globalThis.File;
        ownerId: string;
        accountId: string;
        path: string;
        onProgress?: (progress: number) => void;
    }) {
        // Validate inputs
        validateFileSize(params.file.size);
        validateFileName(params.file.name);
        if (params.path) {
            validatePath(params.path);
        }

        return withRetry(async () => {
            const client = getS3Client(params.config);

            // Normalize and sanitize
            const normalizedPath = params.path ? normalizePath(params.path) : "";
            const sanitizedName = sanitizeFileName(params.file.name);
            const key = normalizedPath ? `${normalizedPath}/${sanitizedName}` : sanitizedName;

            try {
                // Report progress start
                params.onProgress?.(0);

                // Convert File to ArrayBuffer for AWS SDK
                const arrayBuffer = await params.file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Report progress (50% - data loaded)
                params.onProgress?.(50);

                const command = new PutObjectCommand({
                    Bucket: params.config.bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: params.file.type || 'application/octet-stream',
                    Metadata: {
                        'original-name': params.file.name,
                        'uploaded-by': params.ownerId,
                    },
                });

                await client.send(command);

                // Report progress complete
                params.onProgress?.(100);

                return { success: true, key };
            } catch (error) {
                throw handleS3Error(error, 'Upload file');
            }
        }, {
            maxRetries: 2, // Fewer retries for uploads to avoid duplicate uploads
        });
    },

    /**
     * Deletes an item from S3 with validation
     */
    async deleteItem(params: {
        config: S3Config;
        key: string;
    }) {
        if (!params.key || typeof params.key !== 'string') {
            throw new S3Error('Key is required for deletion', 'VALIDATION_ERROR');
        }

        return withRetry(async () => {
            const client = getS3Client(params.config);
            
            try {
                const command = new DeleteObjectCommand({
                    Bucket: params.config.bucket,
                    Key: params.key,
                });
                await client.send(command);
                return { success: true };
            } catch (error) {
                throw handleS3Error(error, 'Delete item');
            }
        });
    },

    /**
     * Creates a folder in S3 with validation
     */
    async createFolder(params: {
        config: S3Config;
        ownerId: string;
        accountId: string;
        name: string;
        path: string;
    }) {
        // Validate folder name
        const folderName = params.name.trim();
        if (!folderName) {
            throw new S3Error('Folder name is required', 'VALIDATION_ERROR');
        }
        
        validatePath(folderName);
        if (params.path) {
            validatePath(params.path);
        }

        return withRetry(async () => {
            const client = getS3Client(params.config);

            // Normalize paths
            const normalizedPath = params.path ? normalizePath(params.path) : "";
            const normalizedFolderName = normalizePath(folderName);
            const folderKey = normalizedPath 
                ? `${normalizedPath}/${normalizedFolderName}/` 
                : `${normalizedFolderName}/`;

            try {
                const command = new PutObjectCommand({
                    Bucket: params.config.bucket,
                    Key: folderKey,
                    Metadata: {
                        'created-by': params.ownerId,
                        'folder': 'true',
                    },
                });
                await client.send(command);
                return { success: true, key: folderKey };
            } catch (error) {
                throw handleS3Error(error, 'Create folder');
            }
        });
    },

    /**
     * Gets a signed URL for downloading a file
     */
    async getSignedUrl(config: S3Config, key: string, expiresIn: number = 3600): Promise<string> {
        if (!key || typeof key !== 'string') {
            throw new S3Error('Key is required for signed URL', 'VALIDATION_ERROR');
        }

        if (expiresIn < 1 || expiresIn > 604800) { // Max 7 days
            throw new S3Error('Expiration time must be between 1 and 604800 seconds', 'VALIDATION_ERROR');
        }

        return withRetry(async () => {
            const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
            const client = getS3Client(config);

            try {
                const command = new GetObjectCommand({
                    Bucket: config.bucket,
                    Key: key,
                });
                return await getSignedUrl(client, command, { expiresIn });
            } catch (error) {
                throw handleS3Error(error, 'Get signed URL');
            }
        });
    },

    /**
     * Gets object metadata
     */
    async head(config: S3Config, key: string) {
        if (!key || typeof key !== 'string') {
            throw new S3Error('Key is required', 'VALIDATION_ERROR');
        }

        return withRetry(async () => {
            const client = getS3Client(config);

            try {
                const command = new HeadObjectCommand({
                    Bucket: config.bucket,
                    Key: key,
                });
                const response = await client.send(command);
                return {
                    metadata: response.Metadata || {},
                    contentType: response.ContentType,
                    contentLength: response.ContentLength,
                    lastModified: response.LastModified,
                    etag: response.ETag,
                };
            } catch (error) {
                throw handleS3Error(error, 'Get object metadata');
            }
        });
    },

    /**
     * Renames a file (copy + delete) with validation
     */
    async rename(config: S3Config, oldKey: string, newKey: string, metadata?: Record<string, string>) {
        if (!oldKey || typeof oldKey !== 'string') {
            throw new S3Error('Old key is required', 'VALIDATION_ERROR');
        }

        if (!newKey || typeof newKey !== 'string') {
            throw new S3Error('New key is required', 'VALIDATION_ERROR');
        }

        // Validate new key (extract filename if it's a path)
        const newKeyParts = newKey.split('/');
        const newFileName = newKeyParts[newKeyParts.length - 1];
        if (newFileName) {
            validateFileName(newFileName);
        }

        return withRetry(async () => {
            const { CopyObjectCommand } = await import("@aws-sdk/client-s3");
            const client = getS3Client(config);

            try {
                // Copy to new key
                const copyCommand = new CopyObjectCommand({
                    Bucket: config.bucket,
                    CopySource: `${config.bucket}/${oldKey}`,
                    Key: newKey,
                    Metadata: metadata,
                    MetadataDirective: metadata ? "REPLACE" : "COPY",
                });
                await client.send(copyCommand);

                // Delete old key
                await this.deleteItem({ config, key: oldKey });

                return { success: true, newKey };
            } catch (error) {
                throw handleS3Error(error, 'Rename file');
            }
        }, {
            maxRetries: 1, // Don't retry rename to avoid duplicate files
        });
    },

    // Alias for deleteItem to match ActionDropdown expectations
    async delete(config: S3Config, key: string) {
        return this.deleteItem({ config, key });
    },
};
