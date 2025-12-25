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
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'document', 'image', 'video', 'audio', 'other'
  extension: text("extension").notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  url: text("url").notNull(),
  storageType: text("storage_type").notNull().default("own-s3"), // 'own-s3', 'platform-s3'
  storageKey: text("storage_key").notNull(), // S3 key or local file path
  bucketName: text("bucket_name"),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
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

