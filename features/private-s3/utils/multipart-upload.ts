/**
 * Multipart Upload Utilities
 * 
 * Handles large file uploads using S3's multipart upload API.
 * Supports chunking, resumable uploads, and network error recovery.
 */

import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand } from "@aws-sdk/client-s3";
import { handleS3Error } from "./errors";

// Constants
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks (S3 minimum is 5MB, max 5GB per part)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // Use multipart for files > 100MB
const MAX_RETRIES_PER_PART = 3;

// Upload state stored in localStorage
export interface MultipartUploadState {
    uploadId: string;
    key: string;
    bucket: string;
    parts: Array<{ partNumber: number; etag: string }>;
    totalParts: number;
    uploadedBytes: number;
    totalBytes: number;
    fileId: string; // Unique identifier for the file (name-size-lastModified)
    timestamp: number;
}

/**
 * Generates a unique file ID for tracking uploads
 */
export function getFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Gets upload state from localStorage
 */
export function getUploadState(fileId: string): MultipartUploadState | null {
    try {
        const stored = localStorage.getItem(`s3-upload-${fileId}`);
        if (!stored) return null;
        const state = JSON.parse(stored) as MultipartUploadState;
        // Check if state is older than 7 days (expire old uploads)
        if (Date.now() - state.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`s3-upload-${fileId}`);
            return null;
        }
        return state;
    } catch {
        return null;
    }
}

/**
 * Saves upload state to localStorage
 */
export function saveUploadState(state: MultipartUploadState): void {
    try {
        localStorage.setItem(`s3-upload-${getFileIdFromState(state)}`, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save upload state:', error);
    }
}

/**
 * Removes upload state from localStorage
 */
export function removeUploadState(fileId: string): void {
    try {
        localStorage.removeItem(`s3-upload-${fileId}`);
    } catch (error) {
        console.error('Failed to remove upload state:', error);
    }
}

/**
 * Gets file ID from upload state
 */
function getFileIdFromState(state: MultipartUploadState): string {
    return state.fileId;
}

/**
 * Calculates the number of parts needed for a file
 */
export function calculatePartCount(fileSize: number): number {
    return Math.ceil(fileSize / CHUNK_SIZE);
}

/**
 * Reads a chunk from a file
 */
export async function readChunk(file: File, start: number, end: number): Promise<Uint8Array> {
    const slice = file.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Initiates a multipart upload
 */
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

/**
 * Uploads a single part with retry logic
 */
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
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
                console.warn(`Retrying part ${partNumber}, attempt ${attempt + 1}/${retries + 1}`);
            }
        }
    }

    throw handleS3Error(lastError || new Error('Upload part failed'), `Upload part ${partNumber}`);
}

/**
 * Completes a multipart upload
 */
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

/**
 * Aborts a multipart upload (cleanup)
 */
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

/**
 * Lists existing parts for a multipart upload (for resuming)
 */
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

/**
 * Determines if a file should use multipart upload
 */
export function shouldUseMultipart(fileSize: number): boolean {
    return fileSize >= MULTIPART_THRESHOLD;
}

/**
 * Detects network connectivity
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Monitors network status and returns a promise that resolves when online
 */
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

