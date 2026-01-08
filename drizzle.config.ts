import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});

