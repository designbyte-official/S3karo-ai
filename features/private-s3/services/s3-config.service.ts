import CryptoJS from "crypto-js";

export type StorageMode = 'managed-storage' | 'own-s3';

export interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    cdnUrl?: string;
}

const STORAGE_MODE_KEY = 's3_karo_storage_mode';
export const S3_CONFIG_KEY = 's3_karo_config_';
// SECURITY: Encryption secret for client-side credential encryption
// Must be set in environment variables - never use default in production
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

// Development fallback - DO NOT USE IN PRODUCTION
// In production, NEXT_PUBLIC_ENCRYPTION_SECRET MUST be set
const FALLBACK_SECRET = 'dev-fallback-secret-change-in-production';

// Use fallback only in development, warn in production
const getEncryptionSecret = (): string => {
  if (ENCRYPTION_SECRET) {
    return ENCRYPTION_SECRET;
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '❌ SECURITY ERROR: NEXT_PUBLIC_ENCRYPTION_SECRET is required in production!\n' +
      'Please set NEXT_PUBLIC_ENCRYPTION_SECRET in your environment variables.\n' +
      'Generate: openssl rand -base64 32'
    );
  }
  
  console.warn('⚠️ NEXT_PUBLIC_ENCRYPTION_SECRET not set. Using development fallback (NOT SECURE for production!)');
  return FALLBACK_SECRET;
};

export const s3ConfigService = {
    getMode(): StorageMode {
        if (typeof window === 'undefined') return 'managed-storage';
        return (localStorage.getItem(STORAGE_MODE_KEY) as StorageMode) || 'managed-storage';
    },

    setMode(mode: StorageMode) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_MODE_KEY, mode);
    },

    async getConfig(userId: string): Promise<S3Config | null> {
        if (typeof window === 'undefined') return null;
        const encryptedConfig = localStorage.getItem(`${S3_CONFIG_KEY}${userId}`);
        if (!encryptedConfig) return null;

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedConfig, getEncryptionSecret());
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            const config = JSON.parse(decryptedData) as S3Config;
            
            return config;
        } catch (e) {
            console.error("Failed to decrypt config", e);
            return null;
        }
    },

    async saveConfig(userId: string, config: S3Config) {
        if (typeof window === 'undefined') return;
        const encryptedConfig = CryptoJS.AES.encrypt(JSON.stringify(config), getEncryptionSecret()).toString();
        localStorage.setItem(`${S3_CONFIG_KEY}${userId}`, encryptedConfig);
    },

    async hasConfig(userId: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(`${S3_CONFIG_KEY}${userId}`);
    },

    async clearConfig(userId: string) {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`${S3_CONFIG_KEY}${userId}`);
    }
};
