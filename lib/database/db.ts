import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Check if database is configured
export const isDatabaseConfigured = (): boolean => {
  return !!connectionString;
};

// Create database connection only if configured
let dbInstance: ReturnType<typeof drizzle> | null = null;

if (connectionString) {
  try {
    const sql = neon(connectionString);
    dbInstance = drizzle(sql, { schema });
  } catch (error) {
    logger.error("Failed to initialize database", error);
    dbInstance = null;
  }
}

// Export db with fallback
export const db = dbInstance;

// Export schema for use in queries
export { schema };

