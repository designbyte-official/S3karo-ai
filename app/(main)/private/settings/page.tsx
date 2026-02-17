"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { S3ConfigForm } from "@/features/private-s3/components/S3ConfigForm";
import type { S3Config } from "@/features/private-s3/services/s3-config.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";

const OwnS3SetupPage = () => {
  const { user } = useAuthStore();
  const [_hasConfig, setHasConfig] = useState(false);
  const [config, setConfig] = useState<S3Config | null>(null);

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
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("s3-config-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("s3-config-updated", handleStorageChange);
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
      <section className="mx-auto w-full max-w-[1240px]">
        <div className="mb-10">
          <h1 className="h1 text-brand">Setup Your S3 Storage</h1>
          <p className="body-1 mt-2 max-w-2xl text-light-200">
            Configure your AWS S3 credentials to start using Private S3 storage.{" "}
            <br className="hidden md:block" />
            These are stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Form Section */}
          <div className="min-w-0 flex-1">
            <div className="rounded-[24px] border border-light-300 bg-white p-8 shadow-drop-1">
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
          <div className="w-full shrink-0 lg:w-[380px]">
            <div className="rounded-[30px] border border-brand-75 bg-brand-50 p-8 shadow-drop-1">
              <h3 className="h3 mb-6 text-brand">What works with Private S3:</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand">•</span>
                  <div>
                    <strong className="block text-[16px] font-semibold text-brand">
                      Secure Uploads
                    </strong>
                    <span className="text-sm text-brand/80">Direct to bucket</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand">•</span>
                  <div>
                    <strong className="block text-[16px] font-semibold text-brand">
                      Global Search
                    </strong>
                    <span className="text-sm text-brand/80">Across all folders</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand">•</span>
                  <div>
                    <strong className="block text-[16px] font-semibold text-brand">
                      File Management
                    </strong>
                    <span className="text-sm text-brand/80">Rename, Delete, Share</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg font-bold text-brand">•</span>
                  <div>
                    <strong className="block text-[16px] font-semibold text-brand">
                      Zero Data Access
                    </strong>
                    <span className="text-sm text-brand/80">Use your own infrastructure</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/private/explorer"
                className="flex items-center justify-center gap-2 font-medium text-light-200 transition-colors hover:text-brand"
              >
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
