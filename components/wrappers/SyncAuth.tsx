"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/auth-store";

export const SyncAuth = ({ user }: { user: any }) => {
  const setUser = useAuthStore((state: any) => state.setUser);
  const setProStatus = useAuthStore((state: any) => state.setProStatus);

  useEffect(() => {
    if (user) {
      setUser(user);
      setProStatus(!!user.isPro);
    }
  }, [user, setUser, setProStatus]);

  return null;
};

export default SyncAuth;
