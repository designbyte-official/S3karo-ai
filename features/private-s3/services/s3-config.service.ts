import CryptoJS from "crypto-js";

export type StorageMode = 'managed-storage' | 'own-s3';

export interface S3Config {
    bucket: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
}

const STORAGE_MODE_KEY = 's3_karo_storage_mode';
export const S3_CONFIG_KEY = 's3_karo_config_';
// Use a consistent encryption secret. In a real app, this might be user-derived or ENV based, 
// but for client-side local-only storage, this prevents plain text reading.
const ENCRYPTION_SECRET = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 's3-karo-local-secure-key';

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
            const bytes = CryptoJS.AES.decrypt(encryptedConfig, ENCRYPTION_SECRET);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedData);
        } catch (e) {
            console.error("Failed to decrypt config", e);
            return null;
        }
    },

    async saveConfig(userId: string, config: S3Config) {
        if (typeof window === 'undefined') return;
        const encryptedConfig = CryptoJS.AES.encrypt(JSON.stringify(config), ENCRYPTION_SECRET).toString();
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
