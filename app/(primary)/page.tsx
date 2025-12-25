import { getFiles } from "@/features/managed-storage/actions/file.actions";
import { getCurrentUser, signOutUser } from "@/features/auth/actions/user.actions";
import DashboardClient from "@/features/managed-storage/components/DashboardClient";
import { S3File as MyFile } from "@/types/file";

const Dashboard = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  let files: { documents: MyFile[]; total: number } = { documents: [], total: 0 };
  let totalSpace = null;

  try {
    files = await getFiles({
      types: [],
      searchText: "",
      sort: "$createdAt-desc",
    });
    // totalSpace fetching remains as a mock or needs to be properly implemented
    totalSpace = await Promise.resolve({ image: { size: 0 }, used: 0, all: 2000000000 });
  } catch (e) {
    console.error("Dashboard data fetch error:", e);
  }

  return (
    <DashboardClient
      files={files.documents}
      totalSpace={totalSpace}
      currentUser={currentUser}
    />
  );
};

export default Dashboard;
