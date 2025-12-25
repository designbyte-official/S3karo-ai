"use client";

import { useEffect } from "react";
import { useAuthStore, User } from "@/lib/stores/auth-store";

export const SyncAuth = ({ user }: { user: User | null }) => {
    const setUser = useAuthStore((state) => state.setUser);
    const setProStatus = useAuthStore((state) => state.setProStatus);

    useEffect(() => {
        if (user) {
            setUser(user);

            // Fetch pro status
            import('@/lib/services/platform/platform-storage.service').then(({ platformStorageService }) => {
                platformStorageService.checkPlatformAccess().then(setProStatus);
            });
        }
    }, [user, setUser, setProStatus]);

    return null;
};
