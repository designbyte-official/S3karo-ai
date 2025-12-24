import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserById } from "@/lib/database/queries";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function verifyAuth() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return { user: null, error: "Not authenticated" };
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
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

