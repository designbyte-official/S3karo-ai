"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { UserInfo, SubscriptionSection } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";

export default function SubscriptionPage() {
  const isManagedStorage = true;
  const { subscription, loading } = useProfile(isManagedStorage);
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile if not in managed storage mode
    if (!isManagedStorage) {
      router.push("/dashboard/profile");
    }
  }, [isManagedStorage, router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="page-container">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <UserInfo />
        {subscription && <SubscriptionSection subscription={subscription} />}
      </div>
    </div>
  );
}
