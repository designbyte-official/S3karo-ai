import { pgTable, text, timestamp, uuid, bigint, jsonb, boolean } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar").default("https://ui-avatars.com/api/?name=User&background=random"),
  passwordHash: text("password_hash").notNull(),
  emailVerified: text("email_verified").default("false"), // 'true', 'false', or verification token
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isPro: boolean("is_pro").default(false),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // 'free', 'basic', 'pro', 'enterprise'
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'expired', 'trial'
  stripeSubscriptionId: text("stripe_subscription_id"), // For Stripe integration
  stripeCustomerId: text("stripe_customer_id"), // For Stripe integration
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table
// NOTE: This table is ONLY for Managed Storage files (platform-managed S3)
// Private S3 files are NOT stored here - they're managed client-side only
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'document', 'image', 'video', 'audio', 'other'
  extension: text("extension").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  url: text("url").notNull(),
  // storageKey: The S3 key where the file is stored (e.g., "managed/{userId}/{path}/{filename}")
  // REQUIRED: Needed to delete, access, and manage the file in S3
  // Format: "managed/{userId}/{path}/{timestamp}-{filename}"
  storageKey: text("storage_key").notNull(),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API Keys table - for external API access to managed storage
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User-friendly name for the API key
  keyHash: text("key_hash").notNull().unique(), // Hashed API key (never store plain text)
  prefix: text("prefix").notNull(), // First 8 chars of key for display (e.g., "sk_live_ab")
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  isActive: boolean("is_active").default(true),
  rateLimit: bigint("rate_limit", { mode: "number" }).default(1000), // Requests per hour
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

