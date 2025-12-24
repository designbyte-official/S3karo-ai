"use client";

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, getS3Bucket } from "./client";
import { getFileType } from "@/lib/utils";

type FileType = "document" | "image" | "video" | "audio" | "other";

export interface S3File {
  $id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  $createdAt: string;
  $updatedAt: string;
  owner: string;
  accountId: string;
  users: string[];
  bucketFileId: string;
  key: string;
}

// Upload file to S3
export const uploadFileToS3 = async (
  file: File,
  ownerId: string,
  accountId: string
): Promise<S3File> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  const fileType = getFileType(file.name);
  const key = `${ownerId}/${Date.now()}-${file.name}`;
  
  const buffer = await file.arrayBuffer();
  
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      Metadata: {
        owner: ownerId,
        accountId: accountId,
        type: fileType.type,
        extension: fileType.extension,
        originalName: file.name,
      },
    })
  );

  // Get file metadata
  const headResponse = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const fileUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: 3600 * 24 * 7 } // 7 days
  );

  const now = new Date().toISOString();
  
  return {
    $id: key,
    name: file.name,
    type: fileType.type,
    extension: fileType.extension,
    size: file.size,
    url: fileUrl,
    $createdAt: now,
    $updatedAt: now,
    owner: ownerId,
    accountId: accountId,
    users: [],
    bucketFileId: key,
    key: key,
  };
};

// Get download URL for S3 file
export const getS3DownloadUrl = async (key: string): Promise<string> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  return await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: 3600 } // 1 hour
  );
};

// Get view URL for S3 file
export const getS3ViewUrl = async (key: string): Promise<string> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  return await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: 3600 * 24 * 7 } // 7 days
  );
};

// List files from S3
export const listS3Files = async (
  ownerId: string,
  accountId: string,
  options: {
    types?: string[];
    searchText?: string;
    sort?: string;
    limit?: number;
    continuationToken?: string;
  } = {}
): Promise<{
  documents: S3File[];
  total: number;
  continuationToken?: string;
}> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  const prefix = `${ownerId}/`;
  
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: options.limit || 1000,
    ContinuationToken: options.continuationToken,
  });

  const response = await client.send(command);
  
  if (!response.Contents) {
    return { documents: [], total: 0 };
  }

  const files: S3File[] = [];
  
  for (const object of response.Contents) {
    if (!object.Key) continue;
    
    // Get metadata
    const headResponse = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: object.Key,
      })
    );

    const metadata = headResponse.Metadata || {};
    const originalName = metadata.originalName || object.Key.split('/').pop() || 'unknown';
    
    // Apply filters
    if (options.types && options.types.length > 0) {
      if (!options.types.includes(metadata.type || 'other')) continue;
    }
    
    if (options.searchText) {
      if (!originalName.toLowerCase().includes(options.searchText.toLowerCase())) {
        continue;
      }
    }

    const fileUrl = await getS3ViewUrl(object.Key);
    
    files.push({
      $id: object.Key,
      name: originalName,
      type: metadata.type || 'other',
      extension: metadata.extension || '',
      size: object.Size || 0,
      url: fileUrl,
      $createdAt: object.LastModified?.toISOString() || new Date().toISOString(),
      $updatedAt: object.LastModified?.toISOString() || new Date().toISOString(),
      owner: metadata.owner || ownerId,
      accountId: metadata.accountId || accountId,
      users: [],
      bucketFileId: object.Key,
      key: object.Key,
    });
  }

  // Apply sorting
  if (options.sort) {
    const [sortBy, orderBy] = options.sort.split('-');
    files.sort((a, b) => {
      let aVal: any = a[sortBy as keyof S3File];
      let bVal: any = b[sortBy as keyof S3File];
      
      if (sortBy === '$createdAt' || sortBy === '$updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (orderBy === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  return {
    documents: files,
    total: files.length,
    continuationToken: response.NextContinuationToken,
  };
};

// Delete file from S3
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
};

// Rename file in S3 (copy and delete)
export const renameFileInS3 = async (
  oldKey: string,
  newName: string,
  ownerId: string
): Promise<S3File> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  // Get old file metadata
  const headResponse = await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: oldKey,
    })
  );

  const metadata = headResponse.Metadata || {};
  const fileType = getFileType(newName);
  
  const newKey = `${ownerId}/${Date.now()}-${newName}`;
  
  // Copy to new key
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${oldKey}`,
      Key: newKey,
      Metadata: {
        ...metadata,
        originalName: newName,
        type: fileType.type,
        extension: fileType.extension,
      },
      MetadataDirective: 'REPLACE',
    })
  );

  // Delete old file
  await deleteFileFromS3(oldKey);

  const fileUrl = await getS3ViewUrl(newKey);
  
  return {
    $id: newKey,
    name: newName,
    type: fileType.type,
    extension: fileType.extension,
    size: headResponse.ContentLength || 0,
    url: fileUrl,
    $createdAt: headResponse.LastModified?.toISOString() || new Date().toISOString(),
    $updatedAt: new Date().toISOString(),
    owner: metadata.owner || ownerId,
    accountId: metadata.accountId || '',
    users: [],
    bucketFileId: newKey,
    key: newKey,
  };
};

// Get total space used from S3
export const getS3TotalSpaceUsed = async (
  ownerId: string
): Promise<{
  image: { size: number; latestDate: string };
  document: { size: number; latestDate: string };
  video: { size: number; latestDate: string };
  audio: { size: number; latestDate: string };
  other: { size: number; latestDate: string };
  used: number;
  all: number;
}> => {
  const client = createS3Client();
  const bucket = getS3Bucket();
  
  const prefix = `${ownerId}/`;
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
  });

  const response = await client.send(command);
  
  const totalSpace = {
    image: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
    used: 0,
    all: 2 * 1024 * 1024 * 1024 * 1024, // 2TB (S3 doesn't have hard limits like Appwrite)
  };

  if (response.Contents) {
    for (const object of response.Contents) {
      if (!object.Key) continue;
      
      const headResponse = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: object.Key,
        })
      );

      const metadata = headResponse.Metadata || {};
      const fileType = (metadata.type || 'other') as FileType;
      const size = object.Size || 0;
      
      totalSpace[fileType].size += size;
      totalSpace.used += size;

      const lastModified = object.LastModified?.toISOString() || '';
      if (
        !totalSpace[fileType].latestDate ||
        lastModified > totalSpace[fileType].latestDate
      ) {
        totalSpace[fileType].latestDate = lastModified;
      }
    }
  }

  return totalSpace;
};

