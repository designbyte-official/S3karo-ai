"use client";

import { UserInfo } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const isManagedStorage = true;
  const { loading } = useProfile(isManagedStorage);
  const router = useRouter();

  useEffect(() => {
    // Redirect to API Keys page by default
    router.push("/dashboard/profile/api-keys");
  }, [router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <UserInfo />
      </div>
    </div>
  );
}

