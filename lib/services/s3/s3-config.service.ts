import { encryptS3Config, decryptS3Config, clearSensitiveData } from '@/lib/encryption';
import { S3Client, ListBucketsCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

export interface S3Config {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    cdnUrl?: string;
}

export type StorageMode = 'own-s3' | 'platform-s3' | 'managed-storage';
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies';
const STORAGE_TYPE = 'localStorage' as StorageType;

export type ConnectionStatus = "idle" | "checking" | "connected" | "disconnected" | "invalid";

export interface ConnectionResult {
    status: ConnectionStatus;
    message: string;
    error?: string;
}

const cookieUtils = {
    get: (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    },
    set: (name: string, value: string, days: number = 365): void => {
        if (typeof document === 'undefined' || typeof window === 'undefined') return;
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    },
    remove: (name: string): void => {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
};

const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    if (STORAGE_TYPE === 'sessionStorage') return window.sessionStorage;
    if (STORAGE_TYPE === 'cookies') return null;
    return window.localStorage;
};

export const s3ConfigService = {
    /**
     * Get storage mode (own-s3 or managed-storage)
     */
    getMode(): StorageMode {
        if (typeof window === 'undefined') return 'managed-storage';

        // Try cookies first
        if (STORAGE_TYPE === 'cookies') {
            const mode = cookieUtils.get('storage-mode');
            if (mode) return mode as StorageMode;
        }

        // Try localStorage/sessionStorage
        const storage = getStorage();
        if (storage) {
            const mode = storage.getItem('storage-mode');
            if (mode) return mode as StorageMode;
        }

        return 'managed-storage';
    },

    /**
     * Set storage mode
     */
    setMode(mode: StorageMode): void {
        if (typeof window === 'undefined') return;

        if (STORAGE_TYPE === 'cookies') {
            cookieUtils.set('storage-mode', mode, 365);
        }

        const storage = getStorage();
        if (storage) {
            storage.setItem('storage-mode', mode);
        }

        // Broadcast event for other tabs
        window.dispatchEvent(new Event('storage'));
    },

    /**
     * Get S3 credentials safely
     */
    async getConfig(userId?: string): Promise<S3Config | null> {
        let encryptedConfig: string | null = null;

        if (STORAGE_TYPE === 'cookies') {
            encryptedConfig = cookieUtils.get('s3-config-encrypted');
        } else {
            const storage = getStorage();
            if (!storage) return null;
            encryptedConfig = storage.getItem('s3-config-encrypted');
        }

        if (!encryptedConfig) return null;

        try {
            const decrypted = await decryptS3Config(encryptedConfig, userId);
            return decrypted as S3Config;
        } catch (error) {
            console.error('Failed to get S3 config:', error);
            this.clear();
            return null;
        }
    },

    /**
     * Save S3 credentials safely
     */
    async saveConfig(config: S3Config, userId?: string): Promise<void> {
        try {
            const encryptedConfig = await encryptS3Config(config, userId);

            if (STORAGE_TYPE === 'cookies') {
                if (encryptedConfig.length > 4000) {
                    console.warn('Encrypted config too large for cookie, falling back to localStorage');
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('s3-config-encrypted', encryptedConfig);
                    }
                } else {
                    cookieUtils.set('s3-config-encrypted', encryptedConfig, 365);
                }
            } else {
                const storage = getStorage();
                if (!storage) return;
                storage.setItem('s3-config-encrypted', encryptedConfig);
            }

            // Clear plaintext from memory (best effort)
            clearSensitiveData(JSON.stringify(config));
        } catch (error) {
            console.error('Failed to set S3 config:', error);
            throw new Error('Failed to securely store S3 credentials');
        }
    },

    /**
     * Clear all S3 credentials
     */
    clear(): void {
        cookieUtils.remove('s3-config-encrypted');
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('s3-config-encrypted');
            window.localStorage.removeItem('s3-config');
            window.sessionStorage.removeItem('s3-config-encrypted');
            window.sessionStorage.removeItem('s3-config');
        }
    },

    /**
     * Check if config exists
     */
    async hasConfig(userId: string): Promise<boolean> {
        const config = await this.getConfig(userId);
        return !!config;
    },

    /**
     * Test S3 connection with provided credentials
     */
    async testConnection(config?: S3Config): Promise<ConnectionResult> {
        try {
            const s3Config = config || await this.getConfig();

            if (!s3Config) {
                return {
                    status: "disconnected",
                    message: "No S3 configuration found",
                    error: "Please configure your AWS credentials",
                };
            }

            if (!s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.region || !s3Config.bucket) {
                return {
                    status: "invalid",
                    message: "Incomplete configuration",
                    error: "Please fill in all required fields",
                };
            }

            const client = new S3Client({
                region: s3Config.region,
                credentials: {
                    accessKeyId: s3Config.accessKeyId,
                    secretAccessKey: s3Config.secretAccessKey,
                },
            });

            try {
                const command = new HeadBucketCommand({
                    Bucket: s3Config.bucket,
                });

                await client.send(command);

                return {
                    status: "connected",
                    message: "Successfully connected to S3",
                };
            } catch (error: any) {
                if (error.name === "NetworkingError" || error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
                    return {
                        status: "invalid",
                        message: "Network error",
                        error: "Failed to connect to AWS. Please check your internet connection and CORS settings.",
                    };
                }
                if (error.name === "NotFound" || error.name === "403" || error.name === "Forbidden") {
                    try {
                        await client.send(new ListBucketsCommand({}));

                        return {
                            status: "invalid",
                            message: "Bucket not found or no access",
                            error: `Bucket "${s3Config.bucket}" not found or you don't have access.`,
                        };
                    } catch (listError: any) {
                        return {
                            status: "invalid",
                            message: "Invalid credentials",
                            error: "Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.",
                        };
                    }
                }

                return {
                    status: "invalid",
                    message: "Connection failed",
                    error: error.message || "Failed to connect to S3",
                };
            }
        } catch (error: any) {
            return {
                status: "invalid",
                message: "Connection error",
                error: error.message || "Unknown error occurred",
            };
        }
    },

    /**
     * Validate S3 configuration format
     */
    validateConfig(config: Partial<S3Config>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!config.accessKeyId || config.accessKeyId.trim() === "") {
            errors.push("Access Key ID is required");
        }
        if (!config.secretAccessKey || config.secretAccessKey.trim() === "") {
            errors.push("Secret Access Key is required");
        }
        if (!config.region || config.region.trim() === "") {
            errors.push("Region is required");
        }
        if (!config.bucket || config.bucket.trim() === "") {
            errors.push("Bucket name is required");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
};
