"use client";

import { useEffect, useState } from "react";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { S3ConfigForm } from "@/features/private-s3/components/S3ConfigForm";

const OwnS3SetupPage = () => {
  const { user } = useAuthStore();
  const [hasConfig, setHasConfig] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const loadConfig = async () => {
      if (user?.$id) {
        const storedConfig = await s3ConfigService.getConfig(user.$id);
        if (storedConfig) {
          setConfig(storedConfig);
          setHasConfig(true);
        } else {
          setConfig(null);
          setHasConfig(false);
        }
      }
    };

    loadConfig();

    // Listen for storage events to refresh config when updated (e.g., CDN URL update)
    const handleStorageChange = () => {
      loadConfig();
    };

    // Listen for both standard storage events (cross-tab) and custom events (same-tab)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('s3-config-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('s3-config-updated', handleStorageChange);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="w-full max-w-[1240px] mx-auto">
        <div className="mb-10">
          <h1 className="h1 text-brand">Setup Your S3 Storage</h1>
          <p className="body-1 text-light-200 mt-2 max-w-2xl">
            Configure your AWS S3 credentials to start using Private S3 storage. <br className="hidden md:block" />
            These are stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Form Section */}
          <div className="flex-1 min-w-0">
            <div className="p-8 rounded-[24px] bg-white shadow-drop-1 border border-light-300">
              <S3ConfigForm
                userId={user.$id}
                defaultValues={config}
                onConfigSaved={async () => {
                  // Config will be reloaded automatically via storage event listener
                  // Optional: Don't auto redirect immediately if you want them to see success state
                  // router.push('/private/explorer') 
                }}
              />
            </div>
          </div>

          {/* Info Section - Styled using Brand Tokens and Shadow */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="p-8 rounded-[30px] bg-brand-50 border border-brand-75 shadow-drop-1">
              <h3 className="h3 text-brand mb-6">What works with Private S3:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-brand font-bold text-lg">•</span>
                  <div>
                    <strong className="block font-semibold text-brand text-[16px]">Secure Uploads</strong>
                    <span className="text-brand/80 text-sm">Direct to bucket</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand font-bold text-lg">•</span>
                  <div>
                    <strong className="block font-semibold text-brand text-[16px]">Global Search</strong>
                    <span className="text-brand/80 text-sm">Across all folders</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand font-bold text-lg">•</span>
                  <div>
                    <strong className="block font-semibold text-brand text-[16px]">File Management</strong>
                    <span className="text-brand/80 text-sm">Rename, Delete, Share</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand font-bold text-lg">•</span>
                  <div>
                    <strong className="block font-semibold text-brand text-[16px]">Zero Data Access</strong>
                    <span className="text-brand/80 text-sm">Use your own infrastructure</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 text-center">
              <Link href="/private/explorer" className="flex items-center justify-center gap-2 text-light-200 hover:text-brand transition-colors font-medium">
                <span>←</span> Back to Private S3 Explorer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OwnS3SetupPage;

