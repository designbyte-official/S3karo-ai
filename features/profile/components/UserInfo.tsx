"use client";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { User, Mail, UserCircle, Hash } from "lucide-react";
import Image from "next/image";

export const UserInfo = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
        <p className="body-2 text-light-200">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
      {/* Header with Avatar and Name */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-light-300">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-light-300 flex-shrink-0">
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
        <div className="flex-1 min-w-0">
          <h1 className="h1 text-brand mb-1 truncate">{user?.fullName || "User"}</h1>
          {user?.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-light-200 flex-shrink-0" />
              <p className="body-2 text-light-200 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-light-200" />
            <span className="body-2 text-light-200">Full Name</span>
          </div>
          <span className="subtitle-2 text-right">{user?.fullName || "Not set"}</span>
        </div>

        {user?.email && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-light-200" />
              <span className="body-2 text-light-200">Email</span>
            </div>
            <span className="subtitle-2 text-right break-all">{user.email}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-light-200" />
            <span className="body-2 text-light-200">User ID</span>
          </div>
          <span className="subtitle-2 font-mono text-sm text-right break-all">{user?.$id || user?.id || "N/A"}</span>
        </div>

        {user?.accountId && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-light-200" />
              <span className="body-2 text-light-200">Account ID</span>
            </div>
            <span className="subtitle-2 font-mono text-sm text-right break-all">{user.accountId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

