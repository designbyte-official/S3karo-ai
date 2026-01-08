import React, { memo } from "react";

import Image from "next/image";

import { Mail, UserCircle, Hash } from "lucide-react";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { cn } from "@/features/shared/utils";

import { ProfileSection } from "./ProfileSection";

const UserDetailItem = memo(
  ({
    icon: Icon,
    label,
    value,
    valueClass = "",
  }: {
    icon: any;
    label: string;
    value: string;
    valueClass?: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-light-200" />
        <span className="body-2 text-light-200">{label}</span>
      </div>
      <span className={cn("subtitle-2 text-right", valueClass)}>{value}</span>
    </div>
  )
);

export const UserInfo = memo(() => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <ProfileSection>
        <p className="body-2 text-light-200">Loading user information...</p>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection headerClassName="flex items-center gap-4">
      {/* Header section moved inside children for custom layout */}
      <div className="mb-6 flex items-center gap-4 border-b border-light-300 pb-6">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-light-300">
          {user?.avatar ? (
            <Image src={user.avatar} alt={user.fullName || "User"} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <UserCircle className="size-10 text-light-200" />
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

      <UserDetailItem icon={UserCircle} label="Full Name" value={user?.fullName || "Not set"} />

      {user?.email && (
        <UserDetailItem icon={Mail} label="Email" value={user.email} valueClass="break-all" />
      )}

      <UserDetailItem
        icon={Hash}
        label="User ID"
        value={user?.$id || user?.id || "N/A"}
        valueClass="break-all font-mono text-sm"
      />

      {user?.accountId && (
        <UserDetailItem
          icon={Hash}
          label="Account ID"
          value={user.accountId}
          valueClass="break-all font-mono text-sm"
        />
      )}
    </ProfileSection>
  );
});
