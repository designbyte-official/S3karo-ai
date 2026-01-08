"use client";

import { useRouter } from "next/navigation";

import { Key, CreditCard } from "lucide-react";

import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { UserInfo } from "@/features/profile/components";
import { useProfile } from "@/features/profile/hooks/use-profile";

export default function ProfilePage() {
  const isManagedStorage = false; // This is in private S3 layout
  const { loading } = useProfile(isManagedStorage);
  const router = useRouter();

  if (loading) {
    return <ProfileSkeleton />;
  }

  const handleNavigateToManaged = (section: "api-keys" | "subscription") => {
    router.push(`/dashboard/profile`);
    // Scroll to section after navigation would happen - but since we're switching modes, just navigate
  };

  return (
    <div className="page-container">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <UserInfo />

        <div className="space-y-4 rounded-[18px] bg-light-300 p-6">
          <div>
            <h2 className="h2 mb-3 text-brand">Private S3 Mode</h2>
            <p className="body-2 mb-4 text-light-200">
              API keys and subscriptions are only available in managed storage mode.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-2 bg-brand text-white hover:bg-brand/90"
            >
              <Key className="size-4" />
              View API Keys
            </Button>
            <Button
              onClick={() => router.push("/dashboard/profile")}
              className="flex items-center gap-2 bg-brand text-white hover:bg-brand/90"
            >
              <CreditCard className="size-4" />
              View Subscription
            </Button>
          </div>

          <p className="body-2 text-sm text-light-200">
            Click the buttons above to switch to managed storage mode and access these features.
          </p>
        </div>
      </div>
    </div>
  );
}
