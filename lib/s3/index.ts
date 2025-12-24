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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
  // Try with ownerId prefix first, then fallback to all files
  const prefix = `${ownerId}/`;
  let response;
  
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: options.limit || 1000,
      ContinuationToken: options.continuationToken,
    });

    response = await client.send(command);
    
    console.log('S3 ListObjects response (with prefix):', {
      keyCount: response.KeyCount,
      contentsLength: response.Contents?.length || 0,
      isTruncated: response.IsTruncated,
      prefix: prefix,
      bucket: bucket
    });
  } catch (error: any) {
    console.error('Error listing with prefix:', error);
    throw new Error(`Failed to list S3 files: ${error.message || 'Unknown error'}`);
  }
  
  // If no files found with prefix, try listing all files in bucket
  if (!response.Contents || response.Contents.length === 0) {
    console.log('No files found with prefix, trying to list all files in bucket...');
    try {
      const fallbackCommand = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: options.limit || 1000,
      });
      const fallbackResponse = await client.send(fallbackCommand);
      console.log('Fallback: Found', fallbackResponse.Contents?.length || 0, 'files in bucket');
      if (fallbackResponse.Contents && fallbackResponse.Contents.length > 0) {
        console.warn('Files found without ownerId prefix. Showing all files in bucket.');
        response = fallbackResponse;
      } else {
        console.log('No files found in bucket at all');
        return { documents: [], total: 0 };
      }
    } catch (fallbackError: any) {
      console.error('Fallback list also failed:', fallbackError);
      return { documents: [], total: 0 };
    }
  } else {
    console.log(`Found ${response.Contents.length} objects in S3 with prefix ${prefix}`);
  }

  const files: S3File[] = [];
  const folders = new Set<string>(); // Track unique folders
  
  for (const object of response.Contents) {
    if (!object.Key) continue;
    
    // Handle folders (keys ending with /)
    if (object.Key.endsWith('/')) {
      const folderName = object.Key.slice(0, -1).split('/').pop() || object.Key.slice(0, -1);
      const folderPath = object.Key.slice(0, -1);
      
      // Only add folder once
      if (!folders.has(folderPath)) {
        folders.add(folderPath);
        files.push({
          $id: folderPath,
          name: folderName,
          type: 'folder',
          extension: '',
          size: 0,
          url: '', // Folders don't have URLs
          $createdAt: object.LastModified?.toISOString() || new Date().toISOString(),
          $updatedAt: object.LastModified?.toISOString() || new Date().toISOString(),
          owner: ownerId,
          accountId: accountId,
          users: [],
          bucketFileId: folderPath,
          key: folderPath,
        });
      }
      continue;
    }
    
    let metadata: Record<string, string> = {};
    let originalName = object.Key.split('/').pop() || 'unknown';
    let fileType = 'other';
    let extension = '';
    
    // Try to get metadata (may fail for files uploaded outside app)
    try {
      const headResponse = await client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: object.Key,
        })
      );
      metadata = headResponse.Metadata || {};
      
      // Use metadata if available
      if (metadata.originalName) {
        originalName = metadata.originalName;
      } else {
        // Extract filename from key (remove ownerId prefix and timestamp if present)
        const parts = object.Key.split('/');
        const filename = parts[parts.length - 1];
        originalName = filename.replace(/^\d+-/, ''); // Remove timestamp prefix
      }
      
      if (metadata.type) {
        fileType = metadata.type;
      }
      if (metadata.extension) {
        extension = metadata.extension;
      }
    } catch (error) {
      // If HeadObject fails, use basic info from ListObjects response
      console.warn(`Could not get metadata for ${object.Key}, using basic info`);
      // Extract filename from key
      const parts = object.Key.split('/');
      const filename = parts[parts.length - 1];
      originalName = filename.replace(/^\d+-/, '');
    }
    
    // If no metadata, infer type and extension from filename
    if (!extension) {
      extension = originalName.split('.').pop()?.toLowerCase() || '';
    }
    
    if (!fileType || fileType === 'other') {
      // Infer type from extension
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension)) {
        fileType = 'image';
      } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
        fileType = 'document';
      } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
        fileType = 'video';
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
        fileType = 'audio';
      } else {
        fileType = 'other';
      }
    }
    
    // Apply filters
    if (options.types && options.types.length > 0) {
      if (!options.types.includes(fileType)) continue;
    }
    
    if (options.searchText) {
      if (!originalName.toLowerCase().includes(options.searchText.toLowerCase())) {
        continue;
      }
    }

    // Only get URL for files (not folders) - images will be lazy loaded in Thumbnail component
    let fileUrl = '';
    if (fileType !== 'folder') {
      fileUrl = await getS3ViewUrl(object.Key);
    }
    
    files.push({
      $id: object.Key,
      name: originalName,
      type: fileType,
      extension: extension,
      size: object.Size || 0,
      url: fileUrl,
      $createdAt: object.LastModified?.toISOString() || new Date().toISOString(),
      $updatedAt: object.LastModified?.toISOString() || new Date().toISOString(),
      owner: metadata.owner || ownerId, // Use ownerId even if file doesn't have prefix
      accountId: metadata.accountId || accountId, // Use accountId even if file doesn't have prefix
      users: [],
      bucketFileId: object.Key,
      key: object.Key,
      isFolder: false,
    });
  }
  
  // Apply sorting (folders first, then by user sort option)
  if (options.sort) {
    const [sortBy, orderBy] = options.sort.split('-');
    files.sort((a, b) => {
      // Keep folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
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
  } else {
    // Default: folders first, then by name
    files.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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
  const client = await createS3Client();
  const bucket = await getS3Bucket();
  
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

