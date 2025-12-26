import { eq, and, ilike, inArray, desc, asc, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "./db";
import { users, files, apiKeys, type User, type NewUser, type File, type NewFile, type ApiKey, type NewApiKey } from "./schema";
import crypto from "crypto";
import { getFileUrl } from '@/features/managed-storage/services/platform-s3.service';

// Helper to check database before queries
const requireDatabase = () => {
  if (!db || !isDatabaseConfigured()) {
    throw new Error("Database not configured. Please add DATABASE_URL to .env.local");
  }
  return db;
};

// User queries
export async function getUserById(userId: string): Promise<User | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    const database = requireDatabase();
    const result = await database.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn("Database query failed:", error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    const database = requireDatabase();
    const result = await database.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn("Database query failed:", error);
    return null;
  }
}

export async function createUser(data: {
  email: string;
  fullName: string;
  passwordHash: string;
}): Promise<User> {
  const database = requireDatabase();
  const result = await database
    .insert(users)
    .values({
      email: data.email,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
    })
    .returning();
  return result[0];
}

export async function updateUser(userId: string, data: Partial<NewUser>): Promise<User | null> {
  const database = requireDatabase();
  const result = await database
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return result[0] || null;
}

// File queries
export async function getFilesForUser(
  userId: string,
  filters?: {
    types?: string[];
    searchText?: string;
    sort?: string;
    limit?: number;
  }
): Promise<File[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const database = requireDatabase();
    const conditions = [eq(files.userId, userId)];

    if (filters?.types && filters.types.length > 0) {
      conditions.push(inArray(files.type, filters.types));
    }

    if (filters?.searchText) {
      conditions.push(ilike(files.name, `%${filters.searchText}%`));
    }

    // Build base query
    const baseQuery = database.select().from(files).where(and(...conditions));

    // Apply sorting and limit
    if (filters?.sort) {
      const [field, direction] = filters.sort.split("-");
      const isAsc = direction === "asc";
      
      if (field === "$createdAt" || field === "createdAt") {
        const sortedQuery = baseQuery.orderBy(isAsc ? asc(files.createdAt) : desc(files.createdAt));
        if (filters?.limit) {
          return await sortedQuery.limit(filters.limit);
        }
        return await sortedQuery;
      } else if (field === "$updatedAt" || field === "updatedAt") {
        const sortedQuery = baseQuery.orderBy(isAsc ? asc(files.updatedAt) : desc(files.updatedAt));
        if (filters?.limit) {
          return await sortedQuery.limit(filters.limit);
        }
        return await sortedQuery;
      } else if (field === "name") {
        const sortedQuery = baseQuery.orderBy(isAsc ? asc(files.name) : desc(files.name));
        if (filters?.limit) {
          return await sortedQuery.limit(filters.limit);
        }
        return await sortedQuery;
      } else if (field === "size") {
        const sortedQuery = baseQuery.orderBy(isAsc ? asc(files.size) : desc(files.size));
        if (filters?.limit) {
          return await sortedQuery.limit(filters.limit);
        }
        return await sortedQuery;
      }
    }
    
    // Default sort by created date descending
    const defaultSortedQuery = baseQuery.orderBy(desc(files.createdAt));
    if (filters?.limit) {
      return await defaultSortedQuery.limit(filters.limit);
    }
    return await defaultSortedQuery;
  } catch (error) {
    console.warn("Database query failed:", error);
    return [];
  }
}

// Create file record (ONLY for Managed Storage - Private S3 files are NOT stored in DB)
// storageKey format: "managed/{userId}/{path}/{timestamp}-{filename}"
// This is REQUIRED - we need it to delete/access files from S3
export async function createFile(data: {
  userId: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  storageKey: string; // REQUIRED: S3 key for file operations (bucket is always from env)
}): Promise<File> {
  const database = requireDatabase();
  const result = await database
    .insert(files)
    .values({
      userId: data.userId,
      name: data.name,
      type: data.type,
      extension: data.extension,
      size: data.size,
      url: data.url,
      storageKey: data.storageKey, // REQUIRED: S3 key for file operations
      sharedWith: [],
    })
    .returning();
  return result[0];
}

// Delete file from database (returns file data before deletion so we can delete from S3)
// NOTE: This is ONLY for Managed Storage - Private S3 files are NOT in the database
export async function deleteFile(fileId: string, userId: string): Promise<File | null> {
  const database = requireDatabase();
  // Get file first to retrieve storageKey before deleting
  const fileToDelete = await database
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .limit(1);
  
  if (fileToDelete.length === 0) {
    return null;
  }

  // Delete from database
  await database
    .delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));

  // Return the file data (including storageKey) so caller can delete from S3
  return fileToDelete[0];
}

export async function updateFile(
  fileId: string,
  userId: string,
  data: {
    name?: string;
    sharedWith?: string[];
    url?: string;
  }
): Promise<File | null> {
  const database = requireDatabase();
  const updateData: Partial<NewFile> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.sharedWith) updateData.sharedWith = data.sharedWith;
  if (data.url) updateData.url = data.url;

  const result = await database
    .update(files)
    .set(updateData)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();
  return result[0] || null;
}

/**
 * Update all file URLs to use CDN URL
 * This migration function regenerates URLs for all files using the new CDN URL format
 */
export async function migrateFileUrlsToCdn(): Promise<{ updated: number; errors: number }> {
  const database = requireDatabase();
  let updated = 0;
  let errors = 0;

  try {
    // Get all files
    const allFiles = await database
      .select({
        id: files.id,
        storageKey: files.storageKey,
      })
      .from(files);

    // Update each file URL
    for (const file of allFiles) {
      try {
        const newUrl = getFileUrl(file.storageKey);
        await database
          .update(files)
          .set({
            url: newUrl,
            updatedAt: new Date(),
          })
          .where(eq(files.id, file.id));
        updated++;
      } catch (error) {
        console.error(`Error updating file ${file.id}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

export async function getTotalSpaceUsed(userId: string): Promise<{
  image: { size: number; latestDate: string };
  document: { size: number; latestDate: string };
  video: { size: number; latestDate: string };
  audio: { size: number; latestDate: string };
  other: { size: number; latestDate: string };
  used: number;
  all: number;
}> {
  if (!isDatabaseConfigured()) {
    return {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
    };
  }
  
  const database = requireDatabase();
  const userFiles = await database
    .select({
      type: files.type,
      size: files.size,
      updatedAt: files.updatedAt,
    })
    .from(files)
    .where(eq(files.userId, userId));

  const totalSpace = {
    image: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
    used: 0,
    all: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
  };

  userFiles.forEach((file) => {
    const fileType = file.type as "image" | "document" | "video" | "audio" | "other";
    totalSpace[fileType].size += file.size || 0;
    totalSpace.used += file.size || 0;

    const updatedAt = file.updatedAt?.toISOString() || "";
    if (!totalSpace[fileType].latestDate || updatedAt > totalSpace[fileType].latestDate) {
      totalSpace[fileType].latestDate = updatedAt;
    }
  });

  return totalSpace;
}

// API Key queries
/**
 * Generate a new API key
 * Returns: { key: "sk_live_...", prefix: "sk_live_ab", apiKey: ApiKey }
 */
export async function createApiKey(data: {
  userId: string;
  name: string;
  expiresAt?: Date;
  rateLimit?: number;
}): Promise<{ key: string; prefix: string; apiKey: ApiKey }> {
  const database = requireDatabase();
  
  // Generate secure API key
  const keyPrefix = "sk_live_";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  const fullKey = `${keyPrefix}${randomBytes}`;
  
  // Hash the key (never store plain text)
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const prefix = `${keyPrefix}${randomBytes.substring(0, 2)}`;
  
  const result = await database
    .insert(apiKeys)
    .values({
      userId: data.userId,
      name: data.name,
      keyHash: keyHash,
      prefix: prefix,
      expiresAt: data.expiresAt || null,
      rateLimit: data.rateLimit || 1000,
      isActive: true,
    })
    .returning();
  
  return {
    key: fullKey, // Only returned once - user must save it
    prefix: prefix,
    apiKey: result[0],
  };
}

/**
 * Verify API key and return associated user
 */
export async function verifyApiKey(apiKey: string): Promise<{ userId: string; apiKey: ApiKey } | null> {
  const database = requireDatabase();
  
  // Hash the provided key
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
  
  // Find matching API key
  const result = await database
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.keyHash, keyHash),
      eq(apiKeys.isActive, true)
    ))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const apiKeyRecord = result[0];
  
  // Check expiration
  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    return null;
  }
  
  // Update last used timestamp
  await database
    .update(apiKeys)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(apiKeys.id, apiKeyRecord.id));
  
  return {
    userId: apiKeyRecord.userId,
    apiKey: apiKeyRecord,
  };
}

/**
 * Get all API keys for a user
 */
export async function getApiKeysForUser(userId: string): Promise<ApiKey[]> {
  const database = requireDatabase();
  return await database
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  const database = requireDatabase();
  const result = await database
    .update(apiKeys)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(
      eq(apiKeys.id, apiKeyId),
      eq(apiKeys.userId, userId)
    ))
    .returning();
  
  return result.length > 0;
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number }> {
  const database = requireDatabase();
  
  // Get API key with rate limit
  const result = await database
    .select({ rateLimit: apiKeys.rateLimit })
    .from(apiKeys)
    .where(eq(apiKeys.id, apiKeyId))
    .limit(1);
  
  if (result.length === 0) {
    return { allowed: false, remaining: 0 };
  }
  
  const rateLimit = result[0].rateLimit || 1000;
  
  // TODO: Implement actual rate limiting with Redis or in-memory cache
  // For now, we'll use a simple approach - in production, use Redis
  // This is a placeholder - you should implement proper rate limiting
  
  return { allowed: true, remaining: rateLimit };
}
