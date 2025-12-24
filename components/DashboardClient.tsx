"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Models } from "node-appwrite";
import ActionDropdown from "@/components/ActionDropdown";
import { Chart } from "@/components/Chart";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import { Thumbnail } from "@/components/Thumbnail";
import { Separator } from "@/components/ui/separator";
import { getFiles as getFilesAppwrite, getTotalSpaceUsed as getTotalSpaceUsedAppwrite } from "@/lib/actions/file.actions";
import { getFiles as getFilesClient, getTotalSpaceUsed as getTotalSpaceUsedClient } from "@/lib/actions/file.actions.client";
import { getStorageMode } from "@/lib/s3/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { convertFileSize, getUsageSummary } from "@/lib/utils";

interface DashboardClientProps {
  initialFiles?: {
    documents: Models.Document[];
    total: number;
  };
  initialTotalSpace?: any;
  currentUser?: {
    $id: string;
    accountId: string;
  };
}

const DashboardClient = ({ initialFiles, initialTotalSpace, currentUser }: DashboardClientProps) => {
  const [files, setFiles] = useState(initialFiles || { documents: [], total: 0 });
  const [totalSpace, setTotalSpace] = useState(initialTotalSpace);
  const [user, setUser] = useState(currentUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const fetchedUser = await getCurrentUser();
        setUser(fetchedUser);
      }
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      const mode = getStorageMode();
      
      try {
        if (mode === 's3') {
          const [filesData, spaceData] = await Promise.all([
            getFilesClient({
              types: [],
              limit: 10,
              ownerId: user.$id,
              accountId: user.accountId,
            }),
            getTotalSpaceUsedClient(user.$id),
          ]);
          setFiles(filesData);
          setTotalSpace(spaceData);
        } else {
          const [filesData, spaceData] = await Promise.all([
            getFilesAppwrite({ types: [], limit: 10 }),
            getTotalSpaceUsedAppwrite(),
          ]);
          setFiles(filesData);
          setTotalSpace(spaceData);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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
        const mode = getStorageMode();
        if (mode === 's3') {
          getFilesClient({
            types: [],
            limit: 10,
            ownerId: user.$id,
            accountId: user.accountId,
          }).then(setFiles);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
            {files.documents.map((file: Models.Document) => (
              <Link
                href={file.url}
                target="_blank"
                className="flex items-center gap-3"
                key={file.$id}
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
                  <ActionDropdown file={file} />
                </div>
              </Link>
            ))}
          </ul>
        ) : (
          <p className="empty-list">No files uploaded</p>
        )}
      </section>
    </div>
  );
};

export default DashboardClient;

