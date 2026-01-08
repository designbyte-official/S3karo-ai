import { cache } from "react";

import { cookies } from "next/headers";

import jwt from "jsonwebtoken";

import { getUserById } from "@/lib/database/queries";
import { hasPlatformAccess } from "@/lib/database/queries-subscriptions";

// SECURITY: JWT_SECRET must be set in environment variables
// Never use default secrets in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "❌ SECURITY ERROR: JWT_SECRET environment variable is not set!\n" +
    "Please set JWT_SECRET in your .env.local file.\n" +
    "Generate a secure secret: openssl rand -base64 32"
  );
}

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return null;
    }

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JWTPayload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }

    // Get user
    const user = await getUserById(decoded.userId);

    if (!user) {
      return null;
    }

    // Get Pro status
    const isPro = await hasPlatformAccess(user.id);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      accountId: user.id,
      $id: user.id, // For compatibility
      isPro,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
});
