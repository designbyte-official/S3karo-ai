import { neon } from '@neondatabase/serverless';
import { logger } from '@/lib/utils/logger';

// Neon Database Configuration
// Get your connection string from: https://console.neon.tech
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  logger.warn('DATABASE_URL not found. Please set your Neon database connection string.');
}

export const sql = neon(connectionString);

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  try {
    const result = await sql(text, params);
    return result;
  } catch (error) {
    logger.error('Database query error', error);
    throw error;
  }
}

// Get current user from database
export async function getUserById(userId: string) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${userId}
  `;
  return result[0] || null;
}

// Get user by email
export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `;
  return result[0] || null;
}

// Create user
export async function createUser(data: {
  email: string;
  full_name: string;
  password_hash: string;
  avatar?: string;
}) {
  const result = await sql`
    INSERT INTO users (email, full_name, password_hash, avatar)
    VALUES (${data.email.toLowerCase()}, ${data.full_name}, ${data.password_hash}, ${data.avatar || 'https://ui-avatars.com/api/?name=User&background=random'})
    RETURNING *
  `;
  return result[0];
}

// Get files for user
export async function getFilesForUser(userId: string, filters?: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
}) {
  let query = sql`
    SELECT * FROM files WHERE user_id = ${userId}
  `;

  if (filters?.types && filters.types.length > 0) {
    query = sql`
      SELECT * FROM files 
      WHERE user_id = ${userId} AND type = ANY(${filters.types})
    `;
  }

  if (filters?.searchText) {
    query = sql`
      SELECT * FROM files 
      WHERE user_id = ${userId} AND name ILIKE ${'%' + filters.searchText + '%'}
    `;
  }

  // Add sorting - build query dynamically but safely
  const sortBy = filters?.sort?.split('-')[0] || 'created_at';
  const orderBy = filters?.sort?.split('-')[1] || 'desc';
  const sortColumn = sortBy === '$createdAt' ? 'created_at' : sortBy === '$updatedAt' ? 'updated_at' : sortBy;
  const sortDirection = orderBy === 'asc' ? 'ASC' : 'DESC';
  
  // Validate sort column to prevent SQL injection
  const validColumns = ['created_at', 'updated_at', 'name', 'size', 'type'];
  const safeSortColumn = validColumns.includes(sortColumn) ? sortColumn : 'created_at';
  const safeSortDirection = sortDirection === 'ASC' ? 'ASC' : 'DESC';
  
  // Build query with proper SQL - use parameterized queries to prevent SQL injection
  // SECURITY: Always use parameterized queries, never string interpolation for user input
  const params: any[] = [userId];
  let queryText = `
    SELECT * FROM files 
    WHERE user_id = $1
    ORDER BY ${safeSortColumn} ${safeSortDirection}
  `.trim();
  
  // Add LIMIT with parameterization if provided
  if (filters?.limit) {
    // Validate limit is a positive integer
    const limit = Math.max(1, Math.min(1000, Math.floor(Number(filters.limit) || 100)));
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(limit);
  }
  
  return await query(queryText, params);
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

// Update file
export async function updateFile(fileId: string, userId: string, data: {
  name?: string;
  shared_with?: string[];
}) {
  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.shared_with) updates.shared_with = data.shared_with;

  const result = await sql`
    UPDATE files 
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${fileId} AND user_id = ${userId}
    RETURNING *
  `;
  return result[0];
}

