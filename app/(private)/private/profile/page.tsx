"use client";

import { UserInfo } from "@/features/profile/components";
import { ProfileSkeleton } from "@/components/common/SkeletonLoader";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Key, CreditCard } from "lucide-react";

export default function ProfilePage() {
  const isManagedStorage = false; // This is in private S3 layout
  const { loading } = useProfile(isManagedStorage);
  const router = useRouter();

  if (loading) {
    return <ProfileSkeleton />;
  }

  const handleNavigateToManaged = (section: "api-keys" | "subscription") => {
    router.push(`/profile`);
    // Scroll to section after navigation would happen - but since we're switching modes, just navigate
  };

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <UserInfo />

        <div className="p-6 bg-light-300 rounded-[18px] space-y-4">
          <div>
            <h2 className="h2 text-brand mb-3">Private S3 Mode</h2>
            <p className="body-2 text-light-200 mb-4">
              API keys and subscriptions are only available in managed storage mode.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white"
            >
              <Key className="w-4 h-4" />
              View API Keys
            </Button>
            <Button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white"
            >
              <CreditCard className="w-4 h-4" />
              View Subscription
            </Button>
          </div>

          <p className="body-2 text-light-200 text-sm">
            Click the buttons above to switch to managed storage mode and access these features.
          </p>
        </div>
      </div>
    </div>
  );
}

