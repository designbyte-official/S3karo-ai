"use client";

import { useEffect, useState } from "react";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { S3ConfigForm } from "@/features/private-s3/components/S3ConfigForm";

const OwnS3SetupPage = () => {
  const [user, setUser] = useState<{ $id: string; accountId: string } | null>(null);
  const [hasConfig, setHasConfig] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser?.$id) {
        const storedConfig = await s3ConfigService.getConfig(currentUser.$id);
        if (storedConfig) {
          setConfig(storedConfig);
          setHasConfig(true);
        }
      }
    };
    fetchUser();
  }, []);

  if (!user) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="h1 text-light-100">Setup Your S3 Storage</h1>
          <p className="body-2 text-light-200 mt-2">
            Configure your AWS S3 credentials to start using Private S3 storage. <br />These are stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-10">
          {/* Form Section */}
          <div className="flex-1 space-y-8">
            <div className="p-6 md:p-8 rounded-[30px] bg-white shadow-drop-1 border border-light-300">
              <S3ConfigForm
                userId={user.$id}
                defaultValues={config}
                onConfigSaved={() => router.push('/private/explorer')}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="w-full xl:w-[320px] shrink-0">
            <div className="p-6 rounded-[30px] bg-brand/5 border border-brand/10">
              <p className="body-1 text-brand font-semibold mb-4">What works with Private S3:</p>
              <ul className="caption text-brand-100 space-y-3">
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong className="font-semibold text-brand">Secure Uploads</strong> - Direct to bucket</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong className="font-semibold text-brand">Global Search</strong> - Across all folders</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong className="font-semibold text-brand">File Management</strong> - Rename, Delete, Share</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand font-bold">•</span>
                  <span><strong className="font-semibold text-brand">Zero Data Access</strong> - Use your own infrastructure</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <Link href="/private/explorer" className="button text-light-200 hover:text-brand transition-colors">
                ← Back to Private S3 Explorer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OwnS3SetupPage;

