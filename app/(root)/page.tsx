import { getFiles, getTotalSpaceUsed } from "@/lib/actions/file.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import DashboardClient from "@/components/DashboardClient";

const Dashboard = async () => {
  // Parallel requests for Appwrite mode (will be overridden by client component if S3 mode)
  const [files, totalSpace, currentUser] = await Promise.all([
    getFiles({ types: [], limit: 10 }),
    getTotalSpaceUsed(),
    getCurrentUser(),
  ]);

  return (
    <DashboardClient
      initialFiles={files}
      initialTotalSpace={totalSpace}
      currentUser={currentUser}
    />
  );
};

export default Dashboard;
