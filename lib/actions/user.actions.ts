"use server";

import { getCurrentUser as getCurrentUserFromAuth } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const getCurrentUser = async () => {
  try {
    const user = await getCurrentUserFromAuth();
    if (!user) return null;
    
    return {
      $id: user.id,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      accountId: user.accountId,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

export const signOutUser = async () => {
  try {
    // Call signout API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/signout`, {
      method: 'POST',
    });
    
    (await cookies()).delete('auth-token');
  } catch (error) {
    console.error("Sign out error:", error);
  } finally {
    redirect("/sign-in");
  }
};

// Legacy functions for compatibility (no longer used but kept for type safety)
export const createAccount = async ({ fullName, email }: { fullName: string; email: string }) => {
  throw new Error("Use API route /api/auth/signup instead");
};

export const signInUser = async ({ email }: { email: string }) => {
  throw new Error("Use API route /api/auth/signin instead");
};

export const verifySecret = async ({ accountId, password }: { accountId: string; password: string }) => {
  throw new Error("Use API route /api/auth/signin instead");
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  throw new Error("Password-based authentication is now used instead of OTP");
};
