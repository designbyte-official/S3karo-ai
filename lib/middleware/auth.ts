import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserById } from "@/lib/database/queries";

// SECURITY: JWT_SECRET must be set in environment variables
// Never use default secrets in production - this will throw an error if not set
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '❌ SECURITY ERROR: JWT_SECRET environment variable is not set!\n' +
    'Please set JWT_SECRET in your .env.local file.\n' +
    'Generate a secure secret: openssl rand -base64 32'
  );
}

export async function verifyAuth() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return { user: null, error: "Not authenticated" };
    }

    // Verify token
    let decoded: any;
    try {
      // JWT_SECRET is validated at module load, so it's guaranteed to be a string here
      decoded = jwt.verify(token, JWT_SECRET as string);
    } catch (error) {
      return { user: null, error: "Invalid token" };
    }

    // Get user from database
    const user = await getUserById(decoded.userId);

    if (!user) {
      return { user: null, error: "User not found" };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        accountId: user.id,
        $id: user.id,
      },
      error: null,
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return { user: null, error: "Authentication failed" };
  }
}

export async function requireAuth() {
  const { user, error } = await verifyAuth();
  
  if (!user || error) {
    throw new Error(error || "Authentication required");
  }
  
  return user;
}

