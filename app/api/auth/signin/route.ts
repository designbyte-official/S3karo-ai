import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { getUserByEmail } from "@/lib/database/queries";
import { apiErrors, createSuccessResponse } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";

// SECURITY: JWT_SECRET must be set in environment variables
// Never use default secrets in production - this will throw an error if not set
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "❌ SECURITY ERROR: JWT_SECRET environment variable is not set!\n" +
      "Please set JWT_SECRET in your .env.local file.\n" +
      "Generate a secure secret: openssl rand -base64 32"
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return apiErrors.badRequest("Email and password are required");
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return apiErrors.unauthorized("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return apiErrors.unauthorized("Invalid email or password");
    }

    if (user.emailVerified !== "true") {
      return NextResponse.json(
        {
          error: "Email not verified",
          needsVerification: true,
          message:
            "Please verify your email address before signing in. Check your inbox for the verification email.",
        },
        { status: 403 }
      );
    }

    // Generate JWT token
    // JWT_SECRET is validated at module load, so it's guaranteed to be a string here
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET as string, {
      expiresIn: "30d",
    });

    // Set cookie
    (await cookies()).set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: unknown) {
    logger.error("Signin error", error);
    return apiErrors.internalServerError("Internal server error", error instanceof Error ? error.message : "Unknown error");
  }
}
