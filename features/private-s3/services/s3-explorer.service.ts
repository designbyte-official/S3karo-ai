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

const getS3Client = (config: S3Config) => {
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
        endpoint: config.endpoint || undefined,
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

                    const baseUrl = params.config.endpoint
                        ? params.config.endpoint.endsWith('/') ? params.config.endpoint : `${params.config.endpoint}/`
                        : `https://${params.config.bucket}.s3.${params.config.region}.amazonaws.com/`;

                    const url = `${baseUrl}${item.Key}`;

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
