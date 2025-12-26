/**
 * Simple AES encryption for S3 credentials
 * Uses Web Crypto API (SubtleCrypto) with Buffer - native browser API, no dependencies
 * Works in all modern browsers and Node.js
 */

/**
 * Get encryption keys from environment variables
 * Uses fixed AES key and IV from environment for consistent encryption
 */
export const getKeys = async () => {
  // Get AES key from environment (base64 encoded)
  const aesKeyBase64 = process.env.NEXT_PUBLIC_AES_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  
  if (!aesKeyBase64) {
    // SECURITY: Never use default keys in production
    // In development, warn but allow; in production, throw error
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ SECURITY ERROR: NEXT_PUBLIC_ENCRYPTION_SECRET is required in production!\n' +
        'Please set NEXT_PUBLIC_ENCRYPTION_SECRET in your environment variables.\n' +
        'Generate a secure secret: openssl rand -base64 32'
      );
    }
    
    console.warn('⚠️ NEXT_PUBLIC_ENCRYPTION_SECRET not set. Using development fallback (NOT SECURE for production!)');
    // Development fallback - DO NOT USE IN PRODUCTION
    const defaultKey = 'dev-fallback-key-change-in-production-32bytes';
    const encryptionKey = Buffer.from(defaultKey.padEnd(32, '0').slice(0, 32));
    const initVector = Buffer.from('dev-iv-12bytes'.padEnd(12, '0').slice(0, 12));
    return { encryptionKey, initVector };
  }

  // Decode base64 key to Buffer
  const encryptionKey = Buffer.from(aesKeyBase64, 'base64');
  
  // Get IV from environment (base64 encoded) or generate from key
  const ivBase64 = process.env.NEXT_PUBLIC_AES_IV;
  let initVector: Buffer;
  
  if (ivBase64) {
    initVector = Buffer.from(ivBase64, 'base64');
  } else {
    // Generate IV from key hash if not provided (12 bytes for AES-GCM)
    const keyHash = Buffer.from(aesKeyBase64.slice(0, 16)).toString('base64').slice(0, 12);
    initVector = Buffer.from(keyHash.padEnd(12, '0').slice(0, 12));
  }

  // Validate key length (must be 32 bytes for AES-256)
  if (encryptionKey.length !== 32) {
    throw new Error('AES key must be 32 bytes (256 bits). Please set NEXT_PUBLIC_AES_KEY to a base64-encoded 32-byte key.');
  }

  // Validate IV length (must be 12 bytes for AES-GCM)
  if (initVector.length !== 12) {
    throw new Error('AES IV must be 12 bytes. Please set NEXT_PUBLIC_AES_IV to a base64-encoded 12-byte IV.');
  }

  return { encryptionKey, initVector };
};

/**
 * Simple AES encryption using Web Crypto API with Buffer
 * Uses AES-256-GCM with fixed key and IV from environment
 */
export const encrypt = async (text: string, userId?: string): Promise<string> => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text to encrypt');
  }

  try {
    // Get encryption keys
    const { encryptionKey, initVector } = await getKeys();
    
    // Prepare the encryption key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(encryptionKey),
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Encode the data to be encrypted
    const encodedData = new TextEncoder().encode(text);

    // Encrypt the encoded data with the key
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      encodedData
    );

    // Return the encrypted data in base64 format
    return Buffer.from(encryptedData).toString('base64');
  } catch (error: any) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Simple AES decryption using Web Crypto API with Buffer
 * Works with encrypted data from encrypt function
 */
export const decrypt = async (encryptedText: string, userId?: string): Promise<string> => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid encrypted text: empty or not a string');
  }

  try {
    // Get encryption keys
    const { encryptionKey, initVector } = await getKeys();

    // Prepare the decryption key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(encryptionKey),
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Decrypt the encrypted data using the key and IV
    const encryptedBuffer = Buffer.from(encryptedText, 'base64');
    const decodedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      new Uint8Array(encryptedBuffer)
    );

    // Decode and return the decrypted data
    const decryptedText = new TextDecoder().decode(decodedData);
    
    if (!decryptedText || decryptedText.length === 0) {
      throw new Error('Decryption resulted in empty string - wrong key or corrupted data');
    }
    
    return decryptedText;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown decryption error';
    console.error('Decryption failed:', errorMessage);
    
    // Provide helpful error message
    if (errorMessage.includes('empty string') || errorMessage.includes('operation') || errorMessage.includes('key')) {
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
export const encryptS3Config = async (config: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}, userId?: string): Promise<string> => {
  const configString = JSON.stringify(config);
  return await encrypt(configString, userId);
};

/**
 * Decrypt S3 configuration
 * Returns null if decryption fails
 */
export const decryptS3Config = async (encryptedConfig: string, userId?: string): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
} | null> => {
  try {
    const decrypted = await decrypt(encryptedConfig, userId);
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

