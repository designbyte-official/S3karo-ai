import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { getCurrentUser } from "@/lib/actions/user.actions";
import DashboardClient from "@/components/DashboardClient";
import { File as MyFile } from "@/types/file";

const Dashboard = async () => {
  const currentUser = await getCurrentUser();

  // Parallel requests for Platform mode (will be overridden by client component if S3 mode)
  let files: { documents: MyFile[]; total: number } = { documents: [], total: 0 };
  let totalSpace = null;

  if (currentUser) {
    [files, totalSpace] = await Promise.all([
      platformStorageService.getFiles({ userId: currentUser.id, limit: 10 }),
      platformStorageService.getStorageStats(currentUser.id),
    ]);
  }

  return (
    <DashboardClient
      initialFiles={files as any}
      initialTotalSpace={totalSpace}
      currentUser={currentUser as any}
    />
  );
};

export default Dashboard;
