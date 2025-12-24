import CryptoJS from 'crypto-js';

// Encryption key - in production, this should be generated per user or stored securely
// For now, we'll use a combination of user ID and a secret
const getEncryptionKey = (userId?: string): string => {
  const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
  return userId ? `${secret}-${userId}` : secret;
};

export const encrypt = (text: string, userId?: string): string => {
  const key = getEncryptionKey(userId);
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = (encryptedText: string, userId?: string): string => {
  const key = getEncryptionKey(userId);
  const bytes = CryptoJS.AES.decrypt(encryptedText, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Encrypt S3 config
export const encryptS3Config = (config: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}, userId?: string): string => {
  const configString = JSON.stringify(config);
  return encrypt(configString, userId);
};

// Decrypt S3 config
export const decryptS3Config = (encryptedConfig: string, userId?: string): {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
} | null => {
  try {
    const decrypted = decrypt(encryptedConfig, userId);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt S3 config:', error);
    return null;
  }
};

