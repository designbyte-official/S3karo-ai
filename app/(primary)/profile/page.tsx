"use client";

import { UserInfo, ApiKeysSection, SubscriptionSection } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { ProfileSkeleton } from "@/components/common/SkeletonLoader";

export default function ProfilePage() {
  const isManagedStorage = true; // This is in managed storage layout
  const { keys, subscription, loading, refetchKeys } = useProfile(isManagedStorage);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <UserInfo />

        <ApiKeysSection keys={keys} onRefresh={refetchKeys} />

        {subscription && <SubscriptionSection subscription={subscription} />}
      </div>
    </div>
  );
}

