// Get encryption keys from environment
export const getKeys = async () => {
  const aesKeyBase64 = process.env.NEXT_PUBLIC_AES_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;
  
  if (!aesKeyBase64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '❌ SECURITY ERROR: NEXT_PUBLIC_ENCRYPTION_SECRET is required in production!\n' +
        'Please set NEXT_PUBLIC_ENCRYPTION_SECRET in your environment variables.\n' +
        'Generate a secure secret: openssl rand -base64 32'
      );
    }
    
    console.warn('⚠️ NEXT_PUBLIC_ENCRYPTION_SECRET not set. Using development fallback');
    const defaultKey = 'dev-fallback-key-change-in-production-32bytes';
    const encryptionKey = Buffer.from(defaultKey.padEnd(32, '0').slice(0, 32));
    const initVector = Buffer.from('dev-iv-12bytes'.padEnd(12, '0').slice(0, 12));
    return { encryptionKey, initVector };
  }

  const encryptionKey = Buffer.from(aesKeyBase64, 'base64');
  const ivBase64 = process.env.NEXT_PUBLIC_AES_IV;
  let initVector: Buffer;
  
  if (ivBase64) {
    initVector = Buffer.from(ivBase64, 'base64');
  } else {
    const keyHash = Buffer.from(aesKeyBase64.slice(0, 16)).toString('base64').slice(0, 12);
    initVector = Buffer.from(keyHash.padEnd(12, '0').slice(0, 12));
  }

  if (encryptionKey.length !== 32) {
    throw new Error('AES key must be 32 bytes');
  }

  if (initVector.length !== 12) {
    throw new Error('AES IV must be 12 bytes');
  }

  return { encryptionKey, initVector };
};

// Encrypt text using AES-256-GCM
export const encrypt = async (text: string, userId?: string): Promise<string> => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text to encrypt');
  }

  try {
    const { encryptionKey, initVector } = await getKeys();
    
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

    const encodedData = new TextEncoder().encode(text);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      encodedData
    );

    return Buffer.from(encryptedData).toString('base64');
  } catch (error: any) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt encrypted text
export const decrypt = async (encryptedText: string, userId?: string): Promise<string> => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid encrypted text: empty or not a string');
  }

  try {
    const { encryptionKey, initVector } = await getKeys();

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

    const encryptedBuffer = Buffer.from(encryptedText, 'base64');
    const decodedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      new Uint8Array(encryptedBuffer)
    );

    const decryptedText = new TextDecoder().decode(decodedData);
    
    if (!decryptedText || decryptedText.length === 0) {
      throw new Error('Decryption failed: wrong key or corrupted data');
    }
    
    return decryptedText;
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown decryption error';
    console.error('Decryption failed:', errorMessage);
    
    if (errorMessage.includes('empty string') || errorMessage.includes('operation') || errorMessage.includes('key')) {
      throw new Error('Decryption failed: Corrupted data or wrong encryption key');
    } else {
      throw new Error(`Decryption failed: ${errorMessage}`);
    }
  }
};

// Encrypt S3 credentials before storing
export const encryptS3Config = async (config: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}, userId?: string): Promise<string> => {
  const configString = JSON.stringify(config);
  return await encrypt(configString, userId);
};

// Decrypt S3 credentials from storage
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
    
    if (!parsed.accessKeyId || !parsed.secretAccessKey || !parsed.region || !parsed.bucket) {
      throw new Error('Invalid S3 config structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to decrypt S3 config:', error);
    return null;
  }
};

export const clearSensitiveData = (data: string): void => {
  if (typeof data === 'string') {
    (data as any) = null;
  }
};

