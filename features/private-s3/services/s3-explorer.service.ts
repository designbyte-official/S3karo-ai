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

const getS3Client = (config: S3Config) => {
    // IMPORTANT: Only use 'endpoint' for S3 API operations (e.g., MinIO)
    // NEVER use 'cdnUrl' here - it's only for viewing files, not API operations
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
        endpoint: config.endpoint || undefined, // Only S3 API endpoint, NOT cdnUrl
        forcePathStyle: !!config.endpoint, // Needed for MinIO/Custom endpoints
    });
};

export const s3ExplorerService = {
    async listItems(params: {
        config: S3Config;
        ownerId: string;
        accountId: string;
        subPath?: string;
        searchText?: string;
        sort?: string;
    }): Promise<{ documents: File[]; total: number }> {
        const client = getS3Client(params.config);

        // REVERTED: Use subPath directly to restore visibility for existing files
        const prefix = params.subPath ? (params.subPath.endsWith('/') ? params.subPath : `${params.subPath}/`) : "";

        try {
            const command = new ListObjectsV2Command({
                Bucket: params.config.bucket,
                Prefix: params.searchText ? "" : prefix, // Recursive search from root if searchText target
                Delimiter: params.searchText ? undefined : "/",
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
                const lowerQuery = params.searchText.toLowerCase();
                resultFiles = resultFiles.filter(f => f.name.toLowerCase().includes(lowerQuery));
            }

            return { documents: resultFiles, total: resultFiles.length };

        } catch (error) {
            console.error("S3 List Error", error);
            return { documents: [], total: 0 };
        }
    },

    async getBucketStats(config: S3Config, prefix: string = "") {
        const client = getS3Client(config);
        try {
            const command = new ListObjectsV2Command({
                Bucket: config.bucket,
                Prefix: prefix,
            });
            const response = await client.send(command);

            let totalSize = 0;
            if (response.Contents) {
                totalSize = response.Contents.reduce((acc, item) => acc + (item.Size || 0), 0);
            }

            return {
                used: totalSize,
                all: undefined, // Total bucket capacity is usually not available via API
            };
        } catch (error) {
            console.error("S3 Stats Error", error);
            return { used: 0, all: undefined };
        }
    },

    async uploadFile(params: {
        config: S3Config;
        file: globalThis.File;
        ownerId: string;
        accountId: string;
        path: string;
    }) {
        const client = getS3Client(params.config);

        let path = params.path || "";
        if (path && !path.endsWith('/')) path += '/';

        const key = `${path}${params.file.name}`;

        try {
            // Convert File to ArrayBuffer for AWS SDK
            const arrayBuffer = await params.file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const command = new PutObjectCommand({
                Bucket: params.config.bucket,
                Key: key,
                Body: buffer,
                ContentType: params.file.type,
            });

            await client.send(command);
            return { success: true };
        } catch (error) {
            console.error("S3 Upload Error", error);
            throw error;
        }
    },

    async deleteItem(params: {
        config: S3Config;
        key: string;
    }) {
        const client = getS3Client(params.config);
        try {
            const command = new DeleteObjectCommand({
                Bucket: params.config.bucket,
                Key: params.key,
            });
            await client.send(command);
        } catch (error) {
            console.error("S3 Delete Error", error);
            throw error;
        }
    },

    async createFolder(params: {
        config: S3Config;
        ownerId: string;
        accountId: string;
        name: string;
        path: string;
    }) {
        const client = getS3Client(params.config);

        let path = params.path || "";
        if (path && !path.endsWith('/')) path += '/';

        const folderName = params.name.endsWith('/') ? params.name : `${params.name}/`;
        const folderKey = `${path}${folderName}`;

        try {
            const command = new PutObjectCommand({
                Bucket: params.config.bucket,
                Key: folderKey,
            });
            await client.send(command);
            return { success: true };
        } catch (error) {
            console.error("S3 Create Folder Error", error);
            throw error;
        }
    },

    // Get signed URL for download
    async getSignedUrl(config: S3Config, key: string, expiresIn: number = 3600): Promise<string> {
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const client = getS3Client(config);

        try {
            const command = new GetObjectCommand({
                Bucket: config.bucket,
                Key: key,
            });
            return await getSignedUrl(client, command, { expiresIn });
        } catch (error) {
            console.error("S3 Get Signed URL Error", error);
            throw error;
        }
    },

    // Get object metadata
    async head(config: S3Config, key: string) {
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
            };
        } catch (error) {
            console.error("S3 Head Error", error);
            throw error;
        }
    },

    // Rename file (copy + delete)
    async rename(config: S3Config, oldKey: string, newKey: string, metadata?: Record<string, string>) {
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

            return { success: true };
        } catch (error) {
            console.error("S3 Rename Error", error);
            throw error;
        }
    },

    // Alias for deleteItem to match ActionDropdown expectations
    async delete(config: S3Config, key: string) {
        return this.deleteItem({ config, key });
    },
};
