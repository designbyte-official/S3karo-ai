import { getFiles } from "@/features/managed-storage/actions/file.actions";
import { getCurrentUser, signOutUser } from "@/features/auth/actions/user.actions";
import { DashboardLayout } from "@/components/common/DashboardLayout";
import { S3File as MyFile } from "@/types/file";

const Dashboard = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  let files: { documents: MyFile[]; total: number } = { documents: [], total: 0 };
  let totalSpace: {
    used: number;
    all?: number;
    image?: { size: number; latestDate: string };
    video?: { size: number; latestDate: string };
    audio?: { size: number; latestDate: string };
    document?: { size: number; latestDate: string };
    other?: { size: number; latestDate: string };
  } = {
    used: 0,
    all: 2 * 1024 * 1024 * 1024,
    image: { size: 0, latestDate: "" },
    video: { size: 0, latestDate: "" },
    audio: { size: 0, latestDate: "" },
    document: { size: 0, latestDate: "" },
    other: { size: 0, latestDate: "" },
  };

  try {
    files = await getFiles({
      types: [],
      searchText: "",
      sort: "$createdAt-desc",
    });
    // totalSpace fetching remains as a mock or needs to be properly implemented
    totalSpace = await Promise.resolve({
      used: 0,
      all: 2 * 1024 * 1024 * 1024,
      image: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
    });
  } catch (e) {
    // Error handled silently - will show empty state
  }

  return (
    <DashboardLayout
      files={files.documents}
      totalSpace={totalSpace}
      currentUser={currentUser}
      variant="brand"
      view="list"
    />
  );
};

export default Dashboard;
