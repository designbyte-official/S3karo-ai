import { encryptS3Config, decryptS3Config, clearSensitiveData } from '@/lib/encryption';

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

/**
 * Storage preference: localStorage, sessionStorage, or cookies
 * - localStorage: Persists across browser sessions (default) - Most convenient
 * - sessionStorage: Cleared when tab closes - More secure
 * - cookies: Sent with requests, can be httpOnly - Most secure but requires server
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies';
const STORAGE_TYPE = 'localStorage' as StorageType;

/**
 * Cookie utility functions for client-side cookie management
 */
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
  if (STORAGE_TYPE === 'cookies') return null; // Cookies handled separately
  return window.localStorage; // Default: localStorage
};

/**
 * Get encrypted S3 configuration from secure storage
 * 
 * SECURITY NOTES:
 * - Credentials are encrypted with PBKDF2 + AES-256-CBC
 * - Each encryption uses random salt and IV
 * - User-specific key derivation adds extra protection
 * - Stored in browser storage (localStorage, sessionStorage, or cookies)
 * 
 * WARNING: Browser storage can be accessed by:
 * - XSS attacks (if your site is compromised)
 * - Browser extensions with storage permissions
 * - Physical access to the device
 * 
 * PROTECTION:
 * - Implement Content Security Policy (CSP) headers
 * - Sanitize all user inputs
 * - Use HTTPS only
 * - Consider sessionStorage or cookies for more security
 */
export const getS3Config = (userId?: string): S3Config | null => {
  let encryptedConfig: string | null = null;
  
  // Get from appropriate storage
  if (STORAGE_TYPE === 'cookies') {
    encryptedConfig = cookieUtils.get('s3-config-encrypted');
  } else {
    const storage = getStorage();
    if (!storage) return null;
    encryptedConfig = storage.getItem('s3-config-encrypted');
  }
  
  if (!encryptedConfig) return null;
  
  try {
    const decrypted = decryptS3Config(encryptedConfig, userId);
    return decrypted;
  } catch (error) {
    console.error('Failed to get S3 config:', error);
    // Clear corrupted data
    clearS3Config();
    return null;
  }
};

/**
 * Store encrypted S3 configuration in secure storage
 * 
 * SECURITY: Credentials are encrypted before storage
 */
export const setS3Config = (config: S3Config, userId?: string) => {
  try {
    const encryptedConfig = encryptS3Config(config, userId);
    
    // Store in appropriate storage
    if (STORAGE_TYPE === 'cookies') {
      // Cookies have 4KB limit, so we store encrypted data
      // If data is too large, fall back to localStorage
      if (encryptedConfig.length > 4000) {
        console.warn('Encrypted config too large for cookie, falling back to localStorage');
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('s3-config-encrypted', encryptedConfig);
        }
      } else {
        cookieUtils.set('s3-config-encrypted', encryptedConfig, 365); // 1 year expiry
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
};

/**
 * Clear S3 configuration from storage
 * 
 * SECURITY: Removes all traces of credentials
 */
export const clearS3Config = () => {
  // Clear from cookies
  cookieUtils.remove('s3-config-encrypted');
  
  // Clear from localStorage
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('s3-config-encrypted');
      window.localStorage.removeItem('s3-config');
      window.sessionStorage.removeItem('s3-config-encrypted');
      window.sessionStorage.removeItem('s3-config');
    } catch (error) {
      // Ignore errors (may fail in private browsing)
    }
  }
};

export type StorageMode = 'own-s3' | 'platform-s3';

/**
 * Get current storage mode preference (own-s3 or platform-s3)
 */
export const getStorageMode = (): StorageMode => {
  // Try cookies first
  if (STORAGE_TYPE === 'cookies') {
    const mode = cookieUtils.get('storage-mode');
    if (mode === 'own-s3' || mode === 'platform-s3') {
      return mode as StorageMode;
    }
  }
  
  // Try localStorage/sessionStorage
  const storage = getStorage();
  if (storage) {
    const mode = storage.getItem('storage-mode');
    if (mode === 'own-s3' || mode === 'platform-s3') {
      return mode as StorageMode;
    }
  }
  
  return 'own-s3'; // Default
};

/**
 * Set storage mode preference (own-s3 or platform-s3)
 */
export const setStorageMode = (mode: StorageMode) => {
  // Store in cookies if using cookie storage
  if (STORAGE_TYPE === 'cookies') {
    cookieUtils.set('storage-mode', mode, 365);
  }
  
  // Also store in localStorage for backward compatibility
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('storage-mode', mode);
  }
  
  // Store in sessionStorage if using sessionStorage
  if (STORAGE_TYPE === 'sessionStorage' && typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem('storage-mode', mode);
  }
};

