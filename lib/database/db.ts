import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create Neon HTTP client
const sql = neon(connectionString);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

// Export schema for use in queries
export { schema };

