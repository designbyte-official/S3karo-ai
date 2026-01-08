import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand } from "@aws-sdk/client-s3";

import { handleS3Error } from "./errors";

const CHUNK_SIZE = 10 * 1024 * 1024;
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
const MAX_RETRIES_PER_PART = 3;

export interface MultipartUploadState {
    uploadId: string;
    key: string;
    bucket: string;
    parts: Array<{ partNumber: number; etag: string }>;
    totalParts: number;
    uploadedBytes: number;
    totalBytes: number;
    fileId: string;
    timestamp: number;
}

// Generate unique ID for file tracking
export function getFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

// Get saved upload state from localStorage
export function getUploadState(fileId: string): MultipartUploadState | null {
    try {
        const stored = localStorage.getItem(`s3-upload-${fileId}`);
        if (!stored) return null;
        const state = JSON.parse(stored) as MultipartUploadState;
        if (Date.now() - state.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`s3-upload-${fileId}`);
            return null;
        }
        return state;
    } catch {
        return null;
    }
}

// Save upload state to localStorage
export function saveUploadState(state: MultipartUploadState): void {
    try {
        localStorage.setItem(`s3-upload-${state.fileId}`, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save upload state:', error);
    }
}

// Remove upload state from localStorage
export function removeUploadState(fileId: string): void {
    try {
        localStorage.removeItem(`s3-upload-${fileId}`);
    } catch (error) {
        console.error('Failed to remove upload state:', error);
    }
}


// Calculate number of parts for file
export function calculatePartCount(fileSize: number): number {
    return Math.ceil(fileSize / CHUNK_SIZE);
}

// Read chunk from file
export async function readChunk(file: File, start: number, end: number): Promise<Uint8Array> {
    const slice = file.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

// Start multipart upload
export async function initiateMultipartUpload(
    client: S3Client,
    bucket: string,
    key: string,
    contentType: string,
    metadata: Record<string, string>
): Promise<string> {
    const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Metadata: metadata,
    });

    const response = await client.send(command);
    if (!response.UploadId) {
        throw new Error('Failed to initiate multipart upload: No upload ID returned');
    }
    return response.UploadId;
}

// Upload single part with retries
export async function uploadPart(
    client: S3Client,
    bucket: string,
    key: string,
    uploadId: string,
    partNumber: number,
    chunk: Uint8Array,
    retries: number = MAX_RETRIES_PER_PART
): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const command = new UploadPartCommand({
                Bucket: bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: chunk,
            });

            const response = await client.send(command);
            if (!response.ETag) {
                throw new Error(`Upload part ${partNumber} failed: No ETag returned`);
            }
            return response.ETag;
        } catch (error) {
            lastError = error as Error;
            if (attempt < retries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                console.warn(`Retrying part ${partNumber}, attempt ${attempt + 1}/${retries + 1}`);
            }
        }
    }

    throw handleS3Error(lastError || new Error('Upload part failed'), `Upload part ${partNumber}`);
}

// Complete multipart upload
export async function completeMultipartUpload(
    client: S3Client,
    bucket: string,
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>
): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts.sort((a, b) => a.partNumber - b.partNumber).map(p => ({
                PartNumber: p.partNumber,
                ETag: p.etag,
            })),
        },
    });

    await client.send(command);
}

// Cancel multipart upload
export async function abortMultipartUpload(
    client: S3Client,
    bucket: string,
    key: string,
    uploadId: string
): Promise<void> {
    try {
        const command = new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
        });
        await client.send(command);
    } catch (error) {
        console.error('Failed to abort multipart upload:', error);
        // Don't throw - cleanup failure shouldn't break the flow
    }
}

// List uploaded parts for resume
export async function listUploadParts(
    client: S3Client,
    bucket: string,
    key: string,
    uploadId: string
): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
    try {
        const command = new ListPartsCommand({
            Bucket: bucket,
            Key: key,
            UploadId: uploadId,
        });

        const response = await client.send(command);
        if (!response.Parts) return [];

        return response.Parts.map(part => ({
            partNumber: part.PartNumber!,
            etag: part.ETag!,
            size: part.Size || 0,
        }));
    } catch (error) {
        console.error('Failed to list upload parts:', error);
        return [];
    }
}

// Check if file should use multipart
export function shouldUseMultipart(fileSize: number): boolean {
    return fileSize >= MULTIPART_THRESHOLD;
}

// Check if online
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

// Wait until online
export function waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
        if (isOnline()) {
            resolve();
            return;
        }

        const handleOnline = () => {
            window.removeEventListener('online', handleOnline);
            resolve();
        };

        window.addEventListener('online', handleOnline);
    });
}

