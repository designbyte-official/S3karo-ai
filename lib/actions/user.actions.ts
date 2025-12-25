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
