import { z } from "zod";

// Email validation
export const emailSchema = z.string().email("Invalid email address");

// Password validation
export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password is too long");

// S3 Config validation
export const s3ConfigSchema = z.object({
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().min(1, "Region is required"),
  bucket: z.string().min(1, "Bucket name is required"),
});

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["document", "image", "video", "audio", "other"]),
  size: z.number().positive(),
});

// File rename validation
export const fileRenameSchema = z.object({
  name: z.string().min(1).max(255),
  extension: z.string().max(10),
});

