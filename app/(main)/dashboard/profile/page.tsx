"use client";

import Link from "next/link";

import { Key, CreditCard } from "lucide-react";

import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { UserInfo } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";



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
      <div className="mx-auto w-full max-w-4xl space-y-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="h1 text-brand">Profile</h1>
        </div>

        {/* User Profile Information */}
        <UserInfo />

        {/* Profile Navigation Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link href="/dashboard/profile/api-keys">
            <div className="cursor-pointer rounded-[18px] border border-light-300 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-brand/10 p-3">
                  <Key className="size-6 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="h5 mb-1 text-brand">API Keys</h3>
                  <p className="body-2 text-light-200">Manage your API keys for external access</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/profile/subscription">
            <div className="cursor-pointer rounded-[18px] border border-light-300 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-brand/10 p-3">
                  <CreditCard className="size-6 text-brand" />
                </div>
                <div className="flex-1">
                  <h3 className="h5 mb-1 text-brand">Subscription</h3>
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

