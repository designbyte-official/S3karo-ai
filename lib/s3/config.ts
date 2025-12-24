import { encryptS3Config, decryptS3Config } from '@/lib/encryption';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export const getS3Config = (userId?: string): S3Config | null => {
  if (typeof window === 'undefined') return null;
  
  const encryptedConfig = localStorage.getItem('s3-config-encrypted');
  if (!encryptedConfig) return null;
  
  try {
    return decryptS3Config(encryptedConfig, userId) || null;
  } catch {
    return null;
  }
};

export const setS3Config = (config: S3Config, userId?: string) => {
  if (typeof window === 'undefined') return;
  const encryptedConfig = encryptS3Config(config, userId);
  localStorage.setItem('s3-config-encrypted', encryptedConfig);
};

export const clearS3Config = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('s3-config-encrypted');
  // Also clear old unencrypted config if exists
  localStorage.removeItem('s3-config');
};

export type StorageMode = 'own-s3' | 'platform-s3';

export const getStorageMode = (): StorageMode => {
  if (typeof window === 'undefined') return 'own-s3';
  return (localStorage.getItem('storage-mode') as StorageMode) || 'own-s3';
};

export const setStorageMode = (mode: StorageMode) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('storage-mode', mode);
};

