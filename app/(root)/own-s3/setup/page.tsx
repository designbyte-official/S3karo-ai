"use client";

import { useEffect, useState } from "react";
import { getStorageMode, getS3Config } from "@/lib/s3/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";
import Link from "next/link";

const OwnS3SetupPage = () => {
  const [user, setUser] = useState<{ $id: string; accountId: string } | null>(null);
  const [hasConfig, setHasConfig] = useState(false);
  const router = useRouter();
  const { setS3SettingsOpen } = useUIStore();

  useEffect(() => {
    const checkMode = () => {
      const mode = getStorageMode();
      if (mode !== 'own-s3') {
        router.push('/');
      }
    };
    
    checkMode();
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Check if S3 config exists
      if (currentUser?.$id) {
        const config = getS3Config(currentUser.$id);
        const configExists = !!(config && config.accessKeyId && config.secretAccessKey && config.bucket);
        setHasConfig(configExists);
        
        // If config exists, redirect to main own-s3 page
        if (configExists) {
          router.push('/own-s3');
        }
      }
    };
    fetchUser();
  }, [router]);

  // Listen for config changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        if (user?.$id) {
          const config = getS3Config(user.$id);
          const configExists = !!(config && config.accessKeyId && config.secretAccessKey && config.bucket);
          if (configExists) {
            router.push('/own-s3');
          }
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="h1 text-light-100">Setup Your S3 Storage</h1>
          <p className="body-2 text-light-200 mt-2">
            Configure your AWS S3 credentials to start using Own S3 storage
          </p>
        </div>

        <div className="p-6 rounded-lg border border-red/30 bg-red/10 shadow-drop-1 mb-6">
          <p className="body-2 text-red font-medium mb-4">
            S3 configuration not found. Please configure your AWS credentials.
          </p>
          <Button
            onClick={() => setS3SettingsOpen(true)}
            className="primary-btn shadow-drop-2"
          >
            Open Settings to Configure S3
          </Button>
        </div>

        {/* Info about Own S3 features */}
        <div className="p-6 rounded-lg border border-blue/30 bg-blue/10 shadow-drop-1">
          <p className="body-2 text-blue font-medium mb-3">What works with Own S3:</p>
          <ul className="caption text-blue/80 space-y-2 mb-4">
            <li>• <strong className="text-blue font-semibold">Upload files</strong> - Upload files directly to your S3 bucket</li>
            <li>• <strong className="text-blue font-semibold">Download files</strong> - Download files from your S3 bucket</li>
            <li>• <strong className="text-blue font-semibold">View files</strong> - Browse all your files</li>
            <li>• <strong className="text-blue font-semibold">Open files</strong> - Click on any file to open it</li>
            <li>• <strong className="text-blue font-semibold">Delete files</strong> - Use the actions menu (three dots) on any file</li>
            <li>• <strong className="text-blue font-semibold">Rename files</strong> - Use the actions menu to rename</li>
            <li>• <strong className="text-blue font-semibold">All operations happen directly in your S3 bucket</strong></li>
            <li>• <strong className="text-blue font-semibold">No database required - pure S3 operations</strong></li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link href="/own-s3" className="body-2 text-light-200 hover:text-light-100 transition-colors">
            ← Back to Own S3 Files
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OwnS3SetupPage;

