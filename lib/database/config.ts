// Using Drizzle ORM with Neon Database (PostgreSQL)
// To switch databases, just update DATABASE_URL and drizzle.config.ts dialect
// Supported: PostgreSQL, MySQL, SQLite, and more via Drizzle adapters

export { db } from "./db";
export * from "./queries";
export * from "./schema";

