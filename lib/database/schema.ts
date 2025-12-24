import { pgTable, text, timestamp, uuid, bigint, jsonb } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar").default("https://ui-avatars.com/api/?name=User&background=random"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'document', 'image', 'video', 'audio', 'other'
  extension: text("extension").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  url: text("url").notNull(),
  storageType: text("storage_type").notNull().default("s3"), // 's3' or 'appwrite'
  storageKey: text("storage_key").notNull(), // S3 key or Appwrite file ID
  bucketName: text("bucket_name"),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

