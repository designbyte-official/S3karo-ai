export interface S3File {
  $id: string;
  id?: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  owner?: {
    $id: string;
    fullName?: string;
  };
  accountId?: string;
  users?: string[];
  bucketFileId?: string;
  key?: string;
  $createdAt: string;
  $updatedAt: string;
  isFolder?: boolean;
  folderPath?: string;
}

export interface StorageStats {
  image: { size: number; latestDate: string };
  document: { size: number; latestDate: string };
  video: { size: number; latestDate: string };
  audio: { size: number; latestDate: string };
  other: { size: number; latestDate: string };
  used: number;
  all: number;
}
