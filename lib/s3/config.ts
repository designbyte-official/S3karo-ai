export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export const getS3Config = (): S3Config | null => {
  if (typeof window === 'undefined') return null;
  
  const config = localStorage.getItem('s3-config');
  if (!config) return null;
  
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
};

export const setS3Config = (config: S3Config) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('s3-config', JSON.stringify(config));
};

export const clearS3Config = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('s3-config');
};

export const getStorageMode = (): 'appwrite' | 's3' => {
  if (typeof window === 'undefined') return 'appwrite';
  return (localStorage.getItem('storage-mode') as 'appwrite' | 's3') || 'appwrite';
};

export const setStorageMode = (mode: 'appwrite' | 's3') => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('storage-mode', mode);
};

