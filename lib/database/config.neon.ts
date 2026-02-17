import { neon } from "@neondatabase/serverless";

import { logger } from "@/lib/utils/logger";

// Neon Database Configuration
// Get your connection string from: https://console.neon.tech
const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  logger.warn("DATABASE_URL not found. Please set your Neon database connection string.");
}

export const sql = neon(connectionString);

// Helper function to execute raw queries with parameters
export async function query(text: string, params?: unknown[]) {
  try {
    // For Neon, we need to use the sql function differently for raw queries
    // We'll construct a parameterized query manually
    if (!params || params.length === 0) {
      // No parameters, use as-is (but this is risky - avoid if possible)
      const result = await sql([text] as unknown as TemplateStringsArray);
      return result;
    }

    // With parameters, we need to construct the query properly
    // Neon doesn't support positional parameters the same way
    // We'll need to use the tagged template approach
    throw new Error("Use sql tagged template literals instead of query() with params");
  } catch (error) {
    logger.error("Database query error", error);
    throw error;
  }
}

// Get files for user
export async function getFilesForUser(
  userId: string,
  filters?: {
    types?: string[];
    searchText?: string;
    sort?: string;
    limit?: number;
  }
) {
  // Build base query (kept for reference; execution uses queryText below)
  let _baseQuery = sql`SELECT * FROM files WHERE user_id = ${userId}`;

  // Apply filters
  if (filters?.types && filters.types.length > 0) {
    _baseQuery = sql`
      SELECT * FROM files 
      WHERE user_id = ${userId} AND type = ANY(${filters.types})
    `;
  }

  if (filters?.searchText) {
    const searchPattern = `%${filters.searchText}%`;
    _baseQuery = sql`
      SELECT * FROM files 
      WHERE user_id = ${userId} AND name ILIKE ${searchPattern}
    `;
  }

  // For sorting and limiting, we need to use raw SQL since Neon doesn't support dynamic ORDER BY
  // Get the sort parameters
  const sortBy = filters?.sort?.split("-")[0] || "created_at";
  const orderBy = filters?.sort?.split("-")[1] || "desc";
  const sortColumn =
    sortBy === "$createdAt" ? "created_at" : sortBy === "$updatedAt" ? "updated_at" : sortBy;
  const sortDirection = orderBy === "asc" ? "ASC" : "DESC";

  // Validate sort column to prevent SQL injection
  const validColumns = ["created_at", "updated_at", "name", "size", "type"];
  const safeSortColumn = validColumns.includes(sortColumn) ? sortColumn : "created_at";
  const safeSortDirection = sortDirection === "ASC" ? "ASC" : "DESC";

  // Build the complete query with sorting
  let queryText = `SELECT * FROM files WHERE user_id = '${userId}'`;

  if (filters?.types && filters.types.length > 0) {
    const typesArray = filters.types.map((t) => `'${t}'`).join(",");
    queryText = `SELECT * FROM files WHERE user_id = '${userId}' AND type = ANY(ARRAY[${typesArray}])`;
  }

  if (filters?.searchText) {
    const escapedSearch = filters.searchText.replace(/'/g, "''");
    queryText = `SELECT * FROM files WHERE user_id = '${userId}' AND name ILIKE '%${escapedSearch}%'`;
  }

  queryText += ` ORDER BY ${safeSortColumn} ${safeSortDirection}`;

  if (filters?.limit) {
    const limit = Math.max(1, Math.min(1000, Math.floor(Number(filters.limit) || 100)));
    queryText += ` LIMIT ${limit}`;
  }

  // Execute using Neon's sql function with raw query
  const result = await sql([queryText] as unknown as TemplateStringsArray);
  return result;
}

// Create file record
// Create file record (ONLY for Managed Storage - Private S3 files are NOT stored in DB)
// bucket_name is NOT stored - always use getPlatformS3Bucket() from env
export async function createFile(data: {
  user_id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  storage_key: string; // S3 key - REQUIRED for deletion/access
}) {
  const result = await sql`
    INSERT INTO files (user_id, name, type, extension, size, url, storage_key)
    VALUES (${data.user_id}, ${data.name}, ${data.type}, ${data.extension}, ${data.size}, ${data.url}, ${data.storage_key})
    RETURNING *
  `;
  return result[0];
}

// Delete file
export async function deleteFile(fileId: string, userId: string) {
  const result = await sql`
    DELETE FROM files WHERE id = ${fileId} AND user_id = ${userId}
    RETURNING *
  `;
  return result[0];
}

export interface FileUpdateData {
  name?: string;
  shared_with?: string[];
}

// Update file
export async function updateFile(fileId: string, userId: string, data: FileUpdateData) {
  if (data.name && data.shared_with) {
    const result = await sql`
      UPDATE files 
      SET name = ${data.name}, shared_with = ${data.shared_with}, updated_at = NOW()
      WHERE id = ${fileId} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  } else if (data.name) {
    const result = await sql`
      UPDATE files 
      SET name = ${data.name}, updated_at = NOW()
      WHERE id = ${fileId} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  } else if (data.shared_with) {
    const result = await sql`
      UPDATE files 
      SET shared_with = ${data.shared_with}, updated_at = NOW()
      WHERE id = ${fileId} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  }
  return null;
}
