"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import { Thumbnail } from "@/components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3ExplorerService } from "@/lib/services/s3/s3-explorer.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import { convertFileSize, getUsageSummary } from "@/lib/utils";
import { File as S3File, StorageStats } from "@/types/file";
import { useRouter } from "next/navigation";
import { useAuthStore, User } from "@/lib/stores/auth-store";

interface DashboardClientProps {
  initialFiles?: {
    documents: S3File[];
    total: number;
  };
  initialTotalSpace?: StorageStats | null;
  currentUser?: User;
}

const DashboardClient = ({ initialFiles, initialTotalSpace, currentUser }: DashboardClientProps) => {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles || { documents: [], total: 0 });
  const [totalSpace, setTotalSpace] = useState<StorageStats | null>(initialTotalSpace || null);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  // No need for fetchUser effect as we use Zustand store

  useEffect(() => {
    // If in own-s3 mode, redirect to the own-s3 page
    // This dashboard is only for Managed Storage
    const mode = s3ConfigService.getMode();
    if (mode === 'own-s3') {
      router.push('/own-s3');
    }
  }, [router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      const mode = s3ConfigService.getMode();

      try {
        if (mode === 'own-s3') {
          const config = await s3ConfigService.getConfig(user.$id);
          if (!config) {
            router.push('/own-s3/setup');
            return;
          }
          const [filesData, spaceData] = await Promise.all([
            s3ExplorerService.listItems({
              config,
              limit: 10,
              ownerId: user.$id,
              accountId: user.accountId,
            }),
            s3ExplorerService.getBucketStats(config, `${user.$id}/${user.accountId}/`),
          ]);
          setFiles(filesData);
          setTotalSpace(spaceData);
        } else if (mode === 'managed-storage' || mode === 'platform-s3') {
          const [filesData, spaceData] = await Promise.all([
            platformStorageService.getFiles({
              userId: user.$id,
              limit: 10,
            }),
            platformStorageService.getStorageStats(user.$id),
          ]);
          setFiles(filesData);
          setTotalSpace(spaceData);
        } else {
          setFiles({ documents: [], total: 0 });
          setTotalSpace(null);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setFiles({ documents: [], total: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        const mode = s3ConfigService.getMode();
        if (mode === 'own-s3') {
          s3ConfigService.getConfig(user.$id).then(config => {
            if (!config) return;
            return s3ExplorerService.listItems({
              config,
              limit: 10,
              ownerId: user.$id,
              accountId: user.accountId,
            });
          }
          ).then(filesData => {
            if (filesData) setFiles(filesData);
          }).catch(console.error);
        } else if (mode === 'managed-storage' || mode === 'platform-s3') {
          platformStorageService.getFiles({
            userId: user.$id,
            limit: 10,
          }).then(setFiles).catch(console.error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user]);

  if (!totalSpace) {
    return <div className="dashboard-container">Loading...</div>;
  }

  const usageSummary = getUsageSummary(totalSpace);

  return (
    <div className="dashboard-container">
      <section>
        <Chart used={totalSpace.used} />

        {/* Uploaded file type summaries */}
        <ul className="dashboard-summary-list">
          {usageSummary.map((summary) => (
            <Link
              href={summary.url}
              key={summary.title}
              className="dashboard-summary-card"
            >
              <div className="space-y-4">
                <div className="flex justify-between gap-3">
                  <Image
                    src={summary.icon}
                    width={100}
                    height={100}
                    alt="uploaded image"
                    className="summary-type-icon"
                  />
                  <h4 className="summary-type-size">
                    {convertFileSize(summary.size) || 0}
                  </h4>
                </div>

                <h5 className="summary-type-title">{summary.title}</h5>
                <Separator className="bg-light-400" />
                <FormattedDateTime
                  date={summary.latestDate}
                  className="text-center"
                />
              </div>
            </Link>
          ))}
        </ul>
      </section>

      {/* Recent files uploaded */}
      <section className="dashboard-recent-files">
        <h2 className="h3 xl:h2 text-light-100">Recent files uploaded</h2>
        {loading ? (
          <p className="empty-list">Loading...</p>
        ) : files.documents.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-5">
            {files.documents.map((file: S3File) => (
              <div
                className="flex items-center gap-3"
                key={file.$id}
              >
                <Link
                  href={file.url}
                  target="_blank"
                  className="flex items-center gap-3 flex-1"
                >
                  <Thumbnail
                    type={file.type}
                    extension={file.extension}
                    url={file.url}
                  />

                  <div className="recent-file-details">
                    <div className="flex flex-col gap-1">
                      <p className="recent-file-name">{file.name}</p>
                      <FormattedDateTime
                        date={file.$createdAt}
                        className="caption"
                      />
                    </div>
                  </div>
                </Link>
                <ActionDropdown file={file} />
              </div>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files uploaded</p>
        )}
      </section>
    </div >
  );
};

export default DashboardClient;

