/**
 * S3 CORE SERVICE
 * 
 * Lowest level AWS SDK wrappers.
 * Pure functions with NO dependencies on application state.
 * Config is passed explicitly.
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    HeadObjectCommand,
    CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    cdnUrl?: string;
}

export const s3CoreService = {
    /**
     * Create S3 client
     */
    createClient(config: S3Config): S3Client {
        return new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    },

    /**
     * Upload file
     */
    async upload(
        config: S3Config,
        file: File | Buffer,
        key: string,
        metadata: {
            contentType: string;
            [key: string]: string;
        }
    ): Promise<{ key: string; size: number }> {
        const client = this.createClient(config);
        const buffer = file instanceof File ? await file.arrayBuffer() : file;

        await client.send(
            new PutObjectCommand({
                Bucket: config.bucket,
                Key: key,
                Body: new Uint8Array(buffer),
                ContentType: metadata.contentType,
                Metadata: metadata,
            })
        );

        const size = file instanceof File ? file.size : buffer.byteLength;
        return { key, size };
    },

    /**
     * List objects
     */
    async list(
        config: S3Config,
        options: {
            prefix?: string;
            maxKeys?: number;
            continuationToken?: string;
            delimiter?: string;
        } = {}
    ) {
        const client = this.createClient(config);

        const command = new ListObjectsV2Command({
            Bucket: config.bucket,
            Prefix: options.prefix,
            MaxKeys: options.maxKeys || 1000,
            ContinuationToken: options.continuationToken,
            Delimiter: options.delimiter,
        });

        const response = await client.send(command);

        const objects = (response.Contents || [])
            .filter((obj) => obj.Key && !obj.Key.endsWith('/'))
            .map((obj) => ({
                key: obj.Key!,
                size: obj.Size || 0,
                lastModified: obj.LastModified || new Date(),
            }));

        const folders = (response.CommonPrefixes || [])
            .map((p) => p.Prefix!)
            .filter(Boolean);

        return {
            objects,
            folders,
            continuationToken: response.NextContinuationToken,
            isTruncated: response.IsTruncated || false,
        };
    },

    /**
     * Delete object
     */
    async delete(config: S3Config, key: string): Promise<void> {
        const client = this.createClient(config);
        await client.send(
            new DeleteObjectCommand({
                Bucket: config.bucket,
                Key: key,
            })
        );
    },

    /**
     * Get signed URL
     */
    async getSignedUrl(
        config: S3Config,
        key: string,
        expiresIn: number = 3600
    ): Promise<string> {
        if (config.cdnUrl?.trim()) {
            const cleanKey = key.startsWith('/') ? key.slice(1) : key;
            const cdnBase = config.cdnUrl.endsWith('/') ? config.cdnUrl : `${config.cdnUrl}/`;
            return `${cdnBase}${cleanKey}`;
        }

        const client = this.createClient(config);
        return await getSignedUrl(
            client,
            new GetObjectCommand({
                Bucket: config.bucket,
                Key: key,
            }),
            { expiresIn }
        );
    },

    /**
     * Rename (Copy + Delete)
     */
    async rename(
        config: S3Config,
        oldKey: string,
        newKey: string,
        metadata?: Record<string, string>
    ): Promise<void> {
        const client = this.createClient(config);
        await client.send(
            new CopyObjectCommand({
                Bucket: config.bucket,
                CopySource: `${config.bucket}/${oldKey}`,
                Key: newKey,
                Metadata: metadata,
                MetadataDirective: metadata ? 'REPLACE' : 'COPY',
            })
        );
        await this.delete(config, oldKey);
    },

    /**
     * Head object
     */
    async head(config: S3Config, key: string) {
        const client = this.createClient(config);
        const response = await client.send(
            new HeadObjectCommand({
                Bucket: config.bucket,
                Key: key,
            })
        );
        return {
            size: response.ContentLength || 0,
            lastModified: response.LastModified || new Date(),
            contentType: response.ContentType,
            metadata: response.Metadata || {},
        };
    }
};
