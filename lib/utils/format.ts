// Format bytes to human-readable string like "1.5 MB" or "500 KB"
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// Format percentage from used/limit ratio, returns string like "75.5"
export const formatPercentage = (used: number, limit: number): string => {
  return ((used / limit) * 100).toFixed(1);
};

// Format date string to locale date or "Never" if null
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString();
};
