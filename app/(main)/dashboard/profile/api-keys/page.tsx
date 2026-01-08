"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { UserInfo, ApiKeysSection } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";

export default function ApiKeysPage() {
  const isManagedStorage = true;
  const { keys, loading, refetchKeys } = useProfile(isManagedStorage);
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
        <ApiKeysSection keys={keys} onRefresh={refetchKeys} />
      </div>
    </div>
  );
}
