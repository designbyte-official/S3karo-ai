"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";

export const SyncAuth = ({ user }: { user: any }) => {
    const setUser = useAuthStore((state: any) => state.setUser);
    const setProStatus = useAuthStore((state: any) => state.setProStatus);

    useEffect(() => {
        if (user) {
            setUser(user);

            // Fetch Pro status after mount
            const checkPro = async () => {
                const access = await platformStorageService.checkPlatformAccess(user.id || user.$id);
                setProStatus(access);
            };

            checkPro();
        }
    }, [user, setUser, setProStatus]);

    return null;
};

export default SyncAuth;
