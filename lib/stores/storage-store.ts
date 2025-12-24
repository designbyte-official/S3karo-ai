import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { S3Config } from '@/lib/s3/config';
import { ConnectionStatus } from '@/lib/s3/validate';

export type StorageMode = 'own-s3' | 'platform-s3';

interface StorageState {
  mode: StorageMode;
  s3Config: S3Config | null;
  hasPlatformAccess: boolean;
  connectionStatus: ConnectionStatus;
  connectionMessage: string;
  setMode: (mode: StorageMode) => void;
  setS3Config: (config: S3Config | null) => void;
  clearS3Config: () => void;
  setPlatformAccess: (hasAccess: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus, message?: string) => void;
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set) => ({
      mode: 'own-s3',
      s3Config: null,
      hasPlatformAccess: false,
      connectionStatus: 'idle' as ConnectionStatus,
      connectionMessage: '',
      setMode: (mode) => {
        set({ mode });
        // Sync with localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          localStorage.setItem('storage-mode', mode);
        }
      },
      setS3Config: (s3Config) => set({ s3Config }),
      clearS3Config: () => set({ s3Config: null, connectionStatus: 'idle', connectionMessage: '' }),
      setPlatformAccess: (hasPlatformAccess) => set({ hasPlatformAccess }),
      setConnectionStatus: (status, message = '') => set({ connectionStatus: status, connectionMessage: message }),
    }),
    {
      name: 'storage-storage',
    }
  )
);

