import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { S3Config } from '@/lib/s3/config';

export type StorageMode = 'own-s3' | 'platform-s3';

interface StorageState {
  mode: StorageMode;
  s3Config: S3Config | null;
  hasPlatformAccess: boolean;
  setMode: (mode: StorageMode) => void;
  setS3Config: (config: S3Config | null) => void;
  clearS3Config: () => void;
  setPlatformAccess: (hasAccess: boolean) => void;
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set) => ({
      mode: 'own-s3',
      s3Config: null,
      hasPlatformAccess: false,
      setMode: (mode) => {
        set({ mode });
        // Sync with localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          localStorage.setItem('storage-mode', mode);
        }
      },
      setS3Config: (s3Config) => set({ s3Config }),
      clearS3Config: () => set({ s3Config: null }),
      setPlatformAccess: (hasPlatformAccess) => set({ hasPlatformAccess }),
    }),
    {
      name: 'storage-storage',
    }
  )
);

