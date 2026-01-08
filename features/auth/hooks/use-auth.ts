"use client";

import { useEffect } from "react";

import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { useAuthStore } from "@/features/auth/stores/auth-store";

// Sync auth state with server
export function useAuthSync() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (user) {
          setUser({
            $id: user.$id,
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar || "",
            accountId: user.accountId,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setLoading]);
}

// Get current auth state
export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
}
