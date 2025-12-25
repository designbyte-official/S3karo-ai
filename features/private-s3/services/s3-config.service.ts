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
        const config = localStorage.getItem(`${S3_CONFIG_KEY}${userId}`);
        return config ? JSON.parse(config) : null;
    },

    async saveConfig(userId: string, config: S3Config) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(`${S3_CONFIG_KEY}${userId}`, JSON.stringify(config));
    },

    async hasConfig(userId: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(`${S3_CONFIG_KEY}${userId}`);
    }
};
