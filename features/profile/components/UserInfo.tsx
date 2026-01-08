"use client";

import Image from "next/image";

import { User, Mail, UserCircle, Hash } from "lucide-react";

import { useAuthStore } from "@/features/auth/stores/auth-store";

export const UserInfo = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
        <p className="body-2 text-light-200">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
      {/* Header with Avatar and Name */}
      <div className="mb-6 flex items-center gap-4 border-b border-light-300 pb-6">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-light-300">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.fullName || "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <User className="size-10 text-light-200" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="h1 mb-1 truncate text-brand">{user?.fullName || "User"}</h1>
          {user?.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-light-200" />
              <p className="body-2 truncate text-light-200">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <UserCircle className="size-4 text-light-200" />
            <span className="body-2 text-light-200">Full Name</span>
          </div>
          <span className="subtitle-2 text-right">{user?.fullName || "Not set"}</span>
        </div>

        {user?.email && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-light-200" />
              <span className="body-2 text-light-200">Email</span>
            </div>
            <span className="subtitle-2 break-all text-right">{user.email}</span>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Hash className="size-4 text-light-200" />
            <span className="body-2 text-light-200">User ID</span>
          </div>
          <span className="subtitle-2 break-all text-right font-mono text-sm">{user?.$id || user?.id || "N/A"}</span>
        </div>

        {user?.accountId && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-light-200" />
              <span className="body-2 text-light-200">Account ID</span>
            </div>
            <span className="subtitle-2 break-all text-right font-mono text-sm">{user.accountId}</span>
          </div>
        )}
      </div>
    </div>
  );
};

