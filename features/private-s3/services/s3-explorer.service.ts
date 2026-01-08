import {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    ListObjectsV2CommandOutput
} from "@aws-sdk/client-s3";

import { getFileType } from "@/features/shared/utils";
import { normalizeBaseUrl, constructFileUrl } from '@/lib/utils/url';
import { S3File as File } from "@/types/file";


import { handleS3Error, S3Error } from "../utils/errors";
import { withRetry } from "../utils/retry";
import { validateFileName, validatePath, validateFileSize, validateS3Config, sanitizeFileName, normalizePath } from "../utils/validation";

import { S3Config } from "./s3-config.service";

// Import URL utilities from shared location

// Check if endpoint is a CloudFront/CDN URL (not suitable for S3 API operations)
const isCloudFrontUrl = (url?: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('cloudfront.net') || 
           lowerUrl.includes('cdn.') ||
           (lowerUrl.startsWith('https://') && !lowerUrl.includes('s3') && !lowerUrl.includes('minio'));
};

// Create S3 client (endpoint only, not cdnUrl)
// Note: CloudFront URLs should NOT be used here - they're for viewing files only
const getS3Client = (config: S3Config): S3Client => {
    validateS3Config(config);
    
    // Don't use CloudFront URLs for API operations - they're not S3 API endpoints
    const endpoint = config.endpoint && !isCloudFrontUrl(config.endpoint) 
        ? config.endpoint 
        : undefined;
    
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
        endpoint,
        forcePathStyle: !!endpoint,
        requestHandler: {
            requestTimeout: 30000,
        },
    });
};

export const s3ExplorerService = {
    // List files and folders in S3
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

            const normalizedPath = params.subPath ? normalizePath(params.subPath) : "";
            const prefix = normalizedPath ? `${normalizedPath}/` : "";

        try {
            const command = new ListObjectsV2Command({
                Bucket: params.config.bucket,
                    Prefix: params.searchText ? "" : prefix,
                Delimiter: params.searchText ? undefined : "/",
                    MaxKeys: params.limit || 1000,
                    ContinuationToken: params.continuationToken,
            });

            const response: ListObjectsV2CommandOutput = await client.send(command);

            const files: File[] = [];

            if (response.CommonPrefixes && !params.searchText) {
                response.CommonPrefixes.forEach((p) => {
                    const name = p.Prefix!.replace(prefix, "").replace("/", "");
                    if (!name) return;

                    files.push({
                        $id: p.Prefix!,
                        bucketFileId: p.Prefix!,
                        name,
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

            if (response.Contents) {
                response.Contents.forEach((item) => {
                    if (item.Key === prefix || !item.Key) return;

                    const name = item.Key.split('/').pop() || "";
                    if (!name) return;

                    const { type, extension } = getFileType(name);

                    let baseUrl: string;
                    if (params.config.cdnUrl) {
                        baseUrl = normalizeBaseUrl(params.config.cdnUrl);
                    } else if (params.config.endpoint) {
                        baseUrl = normalizeBaseUrl(params.config.endpoint);
                    } else {
                        baseUrl = normalizeBaseUrl(`https://${params.config.bucket}.s3.${params.config.region}.amazonaws.com`);
                    }

                    const url = constructFileUrl(baseUrl, item.Key || '');

                    files.push({
                        $id: item.Key!,
                        bucketFileId: item.Key!,
                        name,
                        type,
                        size: item.Size || 0,
                        extension,
                        url,
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

    // Get bucket stats
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
                all: undefined,
            };
        } catch (error) {
                throw handleS3Error(error, 'Get bucket stats');
        }
        });
    },

    // Upload file (auto multipart for large files)
    async uploadFile(params: {
        config: S3Config;
        file: globalThis.File;
        ownerId: string;
        accountId: string;
        path: string;
        onProgress?: (progress: number) => void;
        onChunkProgress?: (chunkNumber: number, totalChunks: number) => void;
        resume?: boolean;
    }) {
        validateFileSize(params.file.size);
        validateFileName(params.file.name);
        if (params.path) {
            validatePath(params.path);
        }

        const normalizedPath = params.path ? normalizePath(params.path) : "";
        const sanitizedName = sanitizeFileName(params.file.name);
        const key = normalizedPath ? `${normalizedPath}/${sanitizedName}` : sanitizedName;

        const {
            shouldUseMultipart,
            getFileId,
            getUploadState,
            saveUploadState,
            removeUploadState,
            calculatePartCount,
            readChunk,
            initiateMultipartUpload,
            uploadPart,
            completeMultipartUpload,
            abortMultipartUpload,
            listUploadParts,
            isOnline,
            waitForOnline,
        } = await import("../utils/multipart-upload");

        const useMultipart = shouldUseMultipart(params.file.size);

        if (useMultipart) {
            return this.uploadFileMultipart({
                ...params,
                key,
                getFileId,
                getUploadState,
                saveUploadState,
                removeUploadState,
                calculatePartCount,
                readChunk,
                initiateMultipartUpload,
                uploadPart,
                completeMultipartUpload,
                abortMultipartUpload,
                listUploadParts,
                isOnline,
                waitForOnline,
            });
        } else {
            // Use simple upload for smaller files
            return withRetry(async () => {
        const client = getS3Client(params.config);

                try {
                    // Check network connectivity
                    if (!isOnline()) {
                        await waitForOnline();
                    }

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
        }
    },

    /**
     * Multipart upload implementation for large files
     */
    async uploadFileMultipart(params: {
        config: S3Config;
        file: globalThis.File;
        ownerId: string;
        accountId: string;
        key: string;
        onProgress?: (progress: number) => void;
        onChunkProgress?: (chunkNumber: number, totalChunks: number) => void;
        resume?: boolean;
        getFileId: (file: globalThis.File) => string;
        getUploadState: (fileId: string) => any;
        saveUploadState: (state: any) => void;
        removeUploadState: (fileId: string) => void;
        calculatePartCount: (fileSize: number) => number;
        readChunk: (file: globalThis.File, start: number, end: number) => Promise<Uint8Array>;
        initiateMultipartUpload: (client: S3Client, bucket: string, key: string, contentType: string, metadata: Record<string, string>) => Promise<string>;
        uploadPart: (client: S3Client, bucket: string, key: string, uploadId: string, partNumber: number, chunk: Uint8Array) => Promise<string>;
        completeMultipartUpload: (client: S3Client, bucket: string, key: string, uploadId: string, parts: Array<{ partNumber: number; etag: string }>) => Promise<void>;
        abortMultipartUpload: (client: S3Client, bucket: string, key: string, uploadId: string) => Promise<void>;
        listUploadParts: (client: S3Client, bucket: string, key: string, uploadId: string) => Promise<Array<{ partNumber: number; etag: string; size: number }>>;
        isOnline: () => boolean;
        waitForOnline: () => Promise<void>;
    }) {
        const client = getS3Client(params.config);
        const fileId = params.getFileId(params.file);
        const totalParts = params.calculatePartCount(params.file.size);
        const CHUNK_SIZE = 10 * 1024 * 1024;

        let uploadId: string;
        let parts: Array<{ partNumber: number; etag: string }> = [];
        let uploadedBytes = 0;
        const existingState = params.resume ? params.getUploadState(fileId) : null;
        if (existingState && existingState.key === params.key && existingState.bucket === params.config.bucket) {
            uploadId = existingState.uploadId;
            parts = existingState.parts;
            uploadedBytes = existingState.uploadedBytes;

            // Verify parts still exist on S3
            const existingParts = await params.listUploadParts(client, params.config.bucket, params.key, uploadId);
            const existingPartNumbers = new Set(existingParts.map(p => p.partNumber));
            parts = parts.filter(p => existingPartNumbers.has(p.partNumber));
            uploadedBytes = parts.reduce((sum, p) => {
                const partInfo = existingParts.find(ep => ep.partNumber === p.partNumber);
                return sum + (partInfo?.size || 0);
            }, 0);

            // Resuming upload: parts already uploaded
        } else {
            // Initiate new multipart upload
            uploadId = await params.initiateMultipartUpload(
                client,
                params.config.bucket,
                params.key,
                params.file.type || 'application/octet-stream',
                {
                    'original-name': params.file.name,
                    'uploaded-by': params.ownerId,
                }
            );

            // Save initial state
            params.saveUploadState({
                uploadId,
                key: params.key,
                bucket: params.config.bucket,
                parts: [],
                totalParts,
                uploadedBytes: 0,
                totalBytes: params.file.size,
                fileId,
                timestamp: Date.now(),
            });
        }

        try {
            // Check network connectivity
            if (!params.isOnline()) {
                await params.waitForOnline();
            }

            // Upload remaining parts
            const uploadedPartNumbers = new Set(parts.map(p => p.partNumber));

            for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
                if (uploadedPartNumbers.has(partNumber)) {
                    // Part already uploaded, skip
                    params.onChunkProgress?.(partNumber, totalParts);
                    continue;
                }

                // Calculate chunk boundaries
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, params.file.size);

                // Read chunk
                const chunk = await params.readChunk(params.file, start, end);

                // Upload part with retry
                let etag: string;
                try {
                    etag = await params.uploadPart(
                        client,
                        params.config.bucket,
                        params.key,
                        uploadId,
                        partNumber,
                        chunk
                    );
                } catch (error) {
                    // Network error - save state and throw
                    params.saveUploadState({
                        uploadId,
                        key: params.key,
                        bucket: params.config.bucket,
                        parts,
                        totalParts,
                        uploadedBytes,
                        totalBytes: params.file.size,
                        fileId,
                        timestamp: Date.now(),
                    });
                    throw handleS3Error(error, `Upload part ${partNumber}`);
                }

                // Add to parts array
                parts.push({ partNumber, etag });
                uploadedBytes += chunk.length;

                // Update state
                params.saveUploadState({
                    uploadId,
                    key: params.key,
                    bucket: params.config.bucket,
                    parts,
                    totalParts,
                    uploadedBytes,
                    totalBytes: params.file.size,
                    fileId,
                    timestamp: Date.now(),
                });

                // Report progress
                const progress = Math.round((uploadedBytes / params.file.size) * 100);
                params.onProgress?.(progress);
                params.onChunkProgress?.(partNumber, totalParts);
            }

            // Complete multipart upload
            await params.completeMultipartUpload(
                client,
                params.config.bucket,
                params.key,
                uploadId,
                parts
            );

            // Clean up state
            params.removeUploadState(fileId);

            params.onProgress?.(100);
            return { success: true, key: params.key };
        } catch (error) {
            // On error, save state for resume (don't abort - allow manual resume)
            params.saveUploadState({
                uploadId,
                key: params.key,
                bucket: params.config.bucket,
                parts,
                totalParts,
                uploadedBytes,
                totalBytes: params.file.size,
                fileId,
                timestamp: Date.now(),
            });
            throw handleS3Error(error, 'Multipart upload');
        }
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

    // Create folder
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

    // Get file metadata
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

    // Rename file (copy + delete)
    async rename(config: S3Config, oldKey: string, newKey: string, metadata?: Record<string, string>) {
        if (!oldKey || typeof oldKey !== 'string') {
            throw new S3Error('Old key is required', 'VALIDATION_ERROR');
        }

        if (!newKey || typeof newKey !== 'string') {
            throw new S3Error('New key is required', 'VALIDATION_ERROR');
        }

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

            await this.deleteItem({ config, key: oldKey });

                return { success: true, newKey };
        } catch (error) {
                throw handleS3Error(error, 'Rename file');
        }
        }, {
            maxRetries: 1,
        });
    },

    // Alias for deleteItem to match ActionDropdown expectations
    async delete(config: S3Config, key: string) {
        return this.deleteItem({ config, key });
    },
};
