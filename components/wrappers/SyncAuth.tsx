"use client";

import { useEffect } from "react";

import type { AuthUser } from "@/features/auth/stores/auth-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export const SyncAuth = ({ user }: { user: AuthUser | null }) => {
  const setUser = useAuthStore((state) => state.setUser);
  const setProStatus = useAuthStore((state) => state.setProStatus);

  useEffect(() => {
    if (user) {
      setUser(user);
      setProStatus(!!user.isPro);
    }
  }, [user, setUser, setProStatus]);

  return null;
};

export default SyncAuth;
