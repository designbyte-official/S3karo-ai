import { S3File as File } from "@/types/file";
import { S3Config, S3_CONFIG_KEY } from "./s3-config.service";
import { getFileType } from "@/features/shared/utils";
import {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
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
        const prefix = params.subPath ? (params.subPath.endsWith('/') ? params.subPath : `${params.subPath}/`) : "";

        try {
            const command = new ListObjectsV2Command({
                Bucket: params.config.bucket,
                Prefix: prefix,
                Delimiter: "/",
            });

            const response: ListObjectsV2CommandOutput = await client.send(command);

            const files: File[] = [];

            // Process Folders (CommonPrefixes)
            if (response.CommonPrefixes) {
                response.CommonPrefixes.forEach((prefix) => {
                    const name = prefix.Prefix!.replace(response.Prefix!, "").replace("/", "");
                    if (!name) return;

                    files.push({
                        $id: prefix.Prefix!,
                        bucketFileId: prefix.Prefix!,
                        name: name,
                        type: "folder",
                        size: 0,
                        extension: "folder",
                        url: "",
                        users: [],
                        accountId: params.accountId,
                        owner: {
                            $id: "user-me",
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
                    if (item.Key === response.Prefix) return; // Skip the folder object itself
                    const name = item.Key!.replace(response.Prefix!, "");
                    const extension = name.split('.').pop() || "file";

                    files.push({
                        $id: item.Key!,
                        bucketFileId: item.Key!,
                        name: name,
                        type: extension, // Simplification
                        size: item.Size || 0,
                        extension: extension,
                        url: `https://${params.config.bucket}.s3.${params.config.region}.amazonaws.com/${item.Key}`, // Basic URL construction
                        users: [],
                        accountId: params.accountId,
                        owner: {
                            $id: "user-me",
                            fullName: "Me",
                        },
                        $createdAt: new Date().toISOString(),
                        $updatedAt: new Date().toISOString(),
                    });
                });
            }

            // Client-side Search/Sort
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

    async uploadFile(params: {
        config: S3Config;
        file: globalThis.File; // Browser File object
        ownerId: string;
        accountId: string;
        path: string;
    }) {
        const client = getS3Client(params.config);
        const key = params.path ? `${params.path}${params.file.name}` : params.file.name;

        try {
            const command = new PutObjectCommand({
                Bucket: params.config.bucket,
                Key: key,
                Body: params.file,
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
        name: string;
        path: string;
    }) {
        const client = getS3Client(params.config);
        const folderKey = params.path
            ? `${params.path}${params.name.endsWith('/') ? params.name : params.name + '/'}`
            : `${params.name.endsWith('/') ? params.name : params.name + '/'}`;

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

    async getBucketStats(config: S3Config, prefix: string) {
        // Stats are expensive in S3 (need to list all). 
        // Returning 0 used and undefined total to hide the chart in Private mode.
        return { used: 0, all: undefined };
    }
};
