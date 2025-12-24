// Using Drizzle ORM with Neon Database (PostgreSQL)
// To switch databases, just update DATABASE_URL and drizzle.config.ts dialect
// Supported: PostgreSQL, MySQL, SQLite, and more via Drizzle adapters

export { db } from "./db";
export * from "./queries";
export * from "./schema";

// Legacy compatibility - now using Drizzle queries
export const createServerClient = () => {
  // This is kept for backward compatibility but queries should use the query functions
  console.warn("createServerClient is deprecated. Use query functions from ./queries instead");
  return null;
};

