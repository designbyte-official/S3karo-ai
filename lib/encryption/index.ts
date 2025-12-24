import CryptoJS from 'crypto-js';

/**
 * Simple AES encryption for S3 credentials
 * Uses AES-256 encryption - simple and reliable
 * Works in both frontend and backend
 */

// Get encryption secret from environment
const getEncryptionSecret = (): string => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret || secret === 'default-secret-key-change-in-production') {
    console.warn('⚠️ Using default encryption secret. This is INSECURE. Set NEXT_PUBLIC_ENCRYPTION_SECRET in production!');
  }
  return secret || 'default-secret-key-change-in-production';
};

/**
 * Simple AES encryption
 * Uses AES-256 with SHA256 hashed key for consistent encryption
 */
export const encrypt = (text: string, userId?: string): string => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text to encrypt');
  }

  try {
    const secret = getEncryptionSecret();
    // Add userId to key for user-specific encryption
    const keyString = userId ? `${secret}-${userId}` : secret;
    
    // Hash the key to ensure it's properly formatted for AES-256
    const key = CryptoJS.SHA256(keyString);
    
    // Simple AES encryption - CryptoJS handles IV automatically
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    
    return encrypted;
  } catch (error: any) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Simple AES decryption
 * Works with encrypted data from encrypt function
 */
export const decrypt = (encryptedText: string, userId?: string): string => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid encrypted text: empty or not a string');
  }

  try {
    const secret = getEncryptionSecret();
    // Use same key derivation as encryption
    const keyString = userId ? `${secret}-${userId}` : secret;
    
    // Hash the key the same way as encryption
    const key = CryptoJS.SHA256(keyString);
    
    // Simple AES decryption
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted || decrypted.length === 0) {
      throw new Error('Decryption resulted in empty string - wrong key or corrupted data');
    }
    
    return decrypted;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown decryption error';
    console.error('Decryption failed:', errorMessage);
    
    // Provide helpful error message
    if (errorMessage.includes('empty string') || errorMessage.includes('Malformed UTF-8') || errorMessage.includes('UTF')) {
      throw new Error('Decryption failed: Corrupted data or wrong encryption key. Please clear and reconfigure your S3 credentials.');
    } else {
      throw new Error(`Decryption failed: ${errorMessage}. Please clear and reconfigure your S3 credentials.`);
    }
  }
};

/**
 * Encrypt S3 configuration
 * This encrypts sensitive AWS credentials before storing in browser
 */
export const encryptS3Config = (config: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}, userId?: string): string => {
  const configString = JSON.stringify(config);
  return encrypt(configString, userId);
};

/**
 * Decrypt S3 configuration
 * Returns null if decryption fails
 */
export const decryptS3Config = (encryptedConfig: string, userId?: string): {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
} | null => {
  try {
    const decrypted = decrypt(encryptedConfig, userId);
    if (!decrypted) {
      return null;
    }
    const parsed = JSON.parse(decrypted);
    
    // Validate required fields
    if (!parsed.accessKeyId || !parsed.secretAccessKey || !parsed.region || !parsed.bucket) {
      throw new Error('Invalid S3 config structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to decrypt S3 config:', error);
    return null;
  }
};

/**
 * Clear sensitive data from memory (best effort)
 * Note: JavaScript doesn't guarantee memory clearing, but we can try
 */
export const clearSensitiveData = (data: string): void => {
  // In a real implementation, you might want to overwrite the string
  // However, JavaScript strings are immutable, so this is best effort
  // The garbage collector will eventually clear it
  if (typeof data === 'string') {
    // Mark for garbage collection
    (data as any) = null;
  }
};

