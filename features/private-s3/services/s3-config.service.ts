import { encryptS3Config, decryptS3Config } from "@/lib/encryption";

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
            const decrypted = await decryptS3Config(encryptedConfig, userId);
            if (!decrypted) {
                // Clear corrupted config
                this.clearConfig(userId);
                return null;
            }
            
            // Get metadata (endpoint, cdnUrl) if exists
            let metadata: { endpoint?: string; cdnUrl?: string } = {};
            const metadataStr = localStorage.getItem(`${S3_CONFIG_KEY}${userId}_meta`);
            if (metadataStr) {
                try {
                    metadata = JSON.parse(metadataStr);
                } catch (parseError) {
                    // If metadata is corrupted, just use empty metadata
                    console.warn('Failed to parse S3 config metadata, using defaults');
                    metadata = {};
                }
            }
            
            return {
                bucket: decrypted.bucket,
                region: decrypted.region,
                accessKeyId: decrypted.accessKeyId,
                secretAccessKey: decrypted.secretAccessKey,
                endpoint: metadata.endpoint,
                cdnUrl: metadata.cdnUrl,
            };
        } catch (e) {
            console.error('Failed to get S3 config:', e);
            // Clear corrupted config on error
            this.clearConfig(userId);
            return null;
        }
    },

    async saveConfig(userId: string, config: S3Config) {
        if (typeof window === 'undefined') return;
        try {
            const encryptedConfig = await encryptS3Config({
                bucket: config.bucket,
                region: config.region,
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            }, userId);
            localStorage.setItem(`${S3_CONFIG_KEY}${userId}`, encryptedConfig);
            
            // Also store endpoint and cdnUrl separately (not encrypted, they're not sensitive)
            if (config.endpoint || config.cdnUrl) {
                const metadata = { endpoint: config.endpoint, cdnUrl: config.cdnUrl };
                // Use replacer to prevent any circular reference issues
                localStorage.setItem(`${S3_CONFIG_KEY}${userId}_meta`, JSON.stringify(metadata, (key, value) => {
                    return value === undefined ? null : value;
                }));
            }
        } catch (error) {
            throw new Error('Failed to save S3 config');
        }
    },

    async hasConfig(userId: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem(`${S3_CONFIG_KEY}${userId}`);
    },

    async clearConfig(userId: string) {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`${S3_CONFIG_KEY}${userId}`);
        localStorage.removeItem(`${S3_CONFIG_KEY}${userId}_meta`);
    }
};
