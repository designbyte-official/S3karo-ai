import { eq, and, ilike, inArray, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import { users, files, type User, type NewUser, type File, type NewFile } from "./schema";

// User queries
export async function getUserById(userId: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] || null;
}

export async function createUser(data: {
  email: string;
  fullName: string;
  passwordHash: string;
  avatar?: string;
}): Promise<User> {
  const result = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      avatar: data.avatar || "https://ui-avatars.com/api/?name=User&background=random",
    })
    .returning();
  return result[0];
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
  // Build conditions array
  const conditions = [eq(files.userId, userId)];

  if (filters?.types && filters.types.length > 0) {
    conditions.push(inArray(files.type, filters.types));
  }

  if (filters?.searchText) {
    conditions.push(ilike(files.name, `%${filters.searchText}%`));
  }

  // Build base query
  let query = db.select().from(files).where(and(...conditions));

  // Apply sorting
  if (filters?.sort) {
    const [sortBy, orderBy] = filters.sort.split("-");
    const sortColumn =
      sortBy === "$createdAt"
        ? files.createdAt
        : sortBy === "$updatedAt"
        ? files.updatedAt
        : sortBy === "name"
        ? files.name
        : sortBy === "size"
        ? files.size
        : files.createdAt;

    if (orderBy === "asc") {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }
  } else {
    query = query.orderBy(desc(files.createdAt));
  }

  // Apply limit
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return await query;
}

export async function createFile(data: {
  userId: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  storageType?: string;
  storageKey: string;
  bucketName?: string;
}): Promise<File> {
  const result = await db
    .insert(files)
    .values({
      userId: data.userId,
      name: data.name,
      type: data.type,
      extension: data.extension,
      size: data.size,
      url: data.url,
      storageType: data.storageType || "s3",
      storageKey: data.storageKey,
      bucketName: data.bucketName || null,
      sharedWith: [],
    })
    .returning();
  return result[0];
}

export async function deleteFile(fileId: string, userId: string): Promise<File | null> {
  const result = await db
    .delete(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();
  return result[0] || null;
}

export async function updateFile(
  fileId: string,
  userId: string,
  data: {
    name?: string;
    sharedWith?: string[];
  }
): Promise<File | null> {
  const updateData: Partial<NewFile> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.sharedWith) updateData.sharedWith = data.sharedWith;

  const result = await db
    .update(files)
    .set(updateData)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();
  return result[0] || null;
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
  const userFiles = await db
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

