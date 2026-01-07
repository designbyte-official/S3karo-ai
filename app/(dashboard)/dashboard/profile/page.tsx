"use client";

import { UserInfo } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Key, CreditCard, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const isManagedStorage = true;
  const { loading } = useProfile(isManagedStorage);

  if (loading) {
    return (
      <div className="page-container">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto space-y-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="h1 text-brand">Profile</h1>
        </div>

        {/* User Profile Information */}
        <UserInfo />

        {/* Profile Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/profile/api-keys">
            <div className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/10 rounded-xl">
                  <Key className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="h5 text-brand mb-1">API Keys</h3>
                  <p className="body-2 text-light-200">Manage your API keys for external access</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/profile/subscription">
            <div className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="h5 text-brand mb-1">Subscription</h3>
                  <p className="body-2 text-light-200">View and manage your subscription plan</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

