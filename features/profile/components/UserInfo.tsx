"use client";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { User } from "lucide-react";
import Image from "next/image";

export const UserInfo = () => {
  const { user } = useAuthStore();

  return (
    <div className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-light-300">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.fullName || "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-light-200" />
            </div>
          )}
        </div>
        <div>
          <h1 className="h1 text-brand">{user?.fullName || "User"}</h1>
          <p className="body-2 text-light-200">{user?.email}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="body-2 text-light-200">User ID</span>
          <span className="subtitle-2 font-mono text-sm">{user?.$id || user?.id}</span>
        </div>
        {user?.accountId && (
          <div className="flex items-center justify-between">
            <span className="body-2 text-light-200">Account ID</span>
            <span className="subtitle-2 font-mono text-sm">{user.accountId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

