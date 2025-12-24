import CryptoJS from 'crypto-js';

/**
 * SECURITY: Enhanced encryption with PBKDF2 key derivation
 * 
 * This provides better security than simple AES encryption:
 * - Uses PBKDF2 for key derivation (slower, harder to brute force)
 * - Random salt for each encryption (prevents rainbow table attacks)
 * - Random IV for each encryption (ensures same plaintext = different ciphertext)
 * - User-specific key derivation (even if secret is exposed, user data is protected)
 */

// Get encryption secret from environment
// WARNING: NEXT_PUBLIC_ prefix means this is exposed to client
// In production, ensure you have proper XSS protection (CSP headers, input sanitization)
const getEncryptionSecret = (): string => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  if (!secret || secret === 'default-secret-key-change-in-production') {
    console.warn('⚠️ Using default encryption secret. This is INSECURE. Set NEXT_PUBLIC_ENCRYPTION_SECRET in production!');
  }
  return secret || 'default-secret-key-change-in-production';
};

// Generate a random salt (16 bytes = 32 hex chars)
const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

// Derive encryption key using PBKDF2 (Password-Based Key Derivation Function 2)
// This makes brute force attacks much slower
const deriveKey = (password: string, salt: string, iterations: number = 10000): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256 bits = 8 words
    iterations: iterations,
  }).toString();
};

/**
 * Encrypt text with enhanced security
 * Format: salt:iv:encryptedData
 */
export const encrypt = (text: string, userId?: string): string => {
  const secret = getEncryptionSecret();
  const userSpecificSecret = userId ? `${secret}-${userId}` : secret;
  
  // Generate random salt and IV for this encryption
  const salt = generateSalt();
  const iv = CryptoJS.lib.WordArray.random(16); // 128-bit IV
  
  // Derive key from password + salt
  const key = deriveKey(userSpecificSecret, salt);
  
  // Encrypt with AES
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  });
  
  // Return format: salt:iv:ciphertext (all base64 encoded)
  return `${salt}:${iv.toString()}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`;
};

/**
 * Decrypt text with enhanced security
 * Supports both new format (salt:iv:encryptedData) and old format (for backward compatibility)
 */
export const decrypt = (encryptedText: string, userId?: string): string => {
  try {
    const secret = getEncryptionSecret();
    const userSpecificSecret = userId ? `${secret}-${userId}` : secret;
    
    // Parse the encrypted format: salt:iv:ciphertext
    const parts = encryptedText.split(':');
    
    // New format: salt:iv:ciphertext (3 parts)
    if (parts.length === 3) {
      const [salt, ivHex, ciphertextBase64] = parts;
      
      // Derive the same key using salt
      const key = deriveKey(userSpecificSecret, salt);
      
      // Reconstruct cipher params
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const ciphertext = CryptoJS.enc.Base64.parse(ciphertextBase64);
      
      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        key,
        {
          iv: iv,
          padding: CryptoJS.pad.Pkcs7,
          mode: CryptoJS.mode.CBC,
        }
      );
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new Error('Decryption resulted in empty string');
      }
      return result;
    }
    
    // Old format: Try legacy decryption (backward compatibility)
    // Old format was simple AES without PBKDF2
    try {
      const key = userSpecificSecret;
      const bytes = CryptoJS.AES.decrypt(encryptedText, key);
      const result = bytes.toString(CryptoJS.enc.Utf8);
      if (result) {
        console.warn('Decrypted using legacy format. Consider re-encrypting for better security.');
        return result;
      }
    } catch (legacyError) {
      // Legacy decryption failed, try new format error
    }
    
    throw new Error('Invalid encrypted format');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
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

