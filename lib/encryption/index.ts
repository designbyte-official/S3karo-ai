// Get encryption keys from environment
export const getKeys = async () => {
  const aesKeyBase64 = process.env.NEXT_PUBLIC_AES_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_SECRET;

  if (!aesKeyBase64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "❌ SECURITY ERROR: NEXT_PUBLIC_ENCRYPTION_SECRET is required in production!\n" +
        "Please set NEXT_PUBLIC_ENCRYPTION_SECRET in your environment variables.\n" +
        "Generate a secure secret: openssl rand -base64 32"
      );
    }

    console.warn("⚠️ NEXT_PUBLIC_ENCRYPTION_SECRET not set. Using development fallback");
    const defaultKey = "dev-fallback-key-change-in-production-32bytes";
    const encryptionKey = Buffer.from(defaultKey.padEnd(32, "0").slice(0, 32));
    const initVector = Buffer.from("dev-iv-12bytes".padEnd(12, "0").slice(0, 12));
    return { encryptionKey, initVector };
  }

  const encryptionKey = Buffer.from(aesKeyBase64, "base64");
  const ivBase64 = process.env.NEXT_PUBLIC_AES_IV;
  let initVector: Buffer;

  if (ivBase64) {
    initVector = Buffer.from(ivBase64, "base64");
  } else {
    const keyHash = Buffer.from(aesKeyBase64.slice(0, 16)).toString("base64").slice(0, 12);
    initVector = Buffer.from(keyHash.padEnd(12, "0").slice(0, 12));
  }

  if (encryptionKey.length !== 32) {
    throw new Error("AES key must be 32 bytes");
  }

  if (initVector.length !== 12) {
    throw new Error("AES IV must be 12 bytes");
  }

  return { encryptionKey, initVector };
};

// Encrypt text using AES-256-GCM
export const encrypt = async (text: string, userId?: string): Promise<string> => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid text to encrypt");
  }

  try {
    const { encryptionKey, initVector } = await getKeys();

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(encryptionKey),
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const encodedData = new TextEncoder().encode(text);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      encodedData
    );

    return Buffer.from(encryptedData).toString("base64");
  } catch (error: unknown) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
};

// Decrypt encrypted text
export const decrypt = async (encryptedText: string, userId?: string): Promise<string> => {
  if (!encryptedText || typeof encryptedText !== "string" || encryptedText.trim().length === 0) {
    throw new Error("Invalid encrypted text: empty or not a string");
  }

  try {
    // Validate base64 format first
    try {
      Buffer.from(encryptedText, "base64");
    } catch {
      throw new Error("Invalid base64 format");
    }

    const { encryptionKey, initVector } = await getKeys();

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(encryptionKey),
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const encryptedBuffer = Buffer.from(encryptedText, "base64");

    // Validate buffer size (must be at least 16 bytes for AES-GCM with tag)
    if (encryptedBuffer.length < 16) {
      throw new Error("Invalid encrypted data: too short");
    }

    const decodedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(initVector),
      },
      cryptoKey,
      new Uint8Array(encryptedBuffer)
    );

    const decryptedText = new TextDecoder().decode(decodedData);

    if (!decryptedText || decryptedText.length === 0) {
      throw new Error("Decryption failed: empty result");
    }

    return decryptedText;
  } catch (error: unknown) {
    // Extract error message more reliably for logging
    const message = error instanceof Error ? error.message : String(error);
    console.error("Decryption failed:", message);

    // Throw a simple error that can be caught
    throw new Error("Decryption failed");
  }
};

// Encrypt S3 credentials before storing
export const encryptS3Config = async (
  config: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  },
  userId?: string
): Promise<string> => {
  // Use a replacer to prevent circular reference errors and ensure clean serialization
  const configString = JSON.stringify(config, (key, value) => {
    // Filter out any undefined values and prevent circular references
    if (value === undefined) {
      return null;
    }
    return value;
  });
  return await encrypt(configString, userId);
};

// Decrypt S3 credentials from storage
export const decryptS3Config = async (
  encryptedConfig: string,
  userId?: string
): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
} | null> => {
  try {
    if (
      !encryptedConfig ||
      typeof encryptedConfig !== "string" ||
      encryptedConfig.trim().length === 0
    ) {
      return null;
    }

    interface S3ConfigData {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    }

    let decrypted: string;
    try {
      decrypted = await decrypt(encryptedConfig, userId);
    } catch (decryptError) {
      // Decryption failed - config is corrupted or wrong key
      // Return null silently - the calling code will handle it
      return null;
    }

    if (!decrypted || decrypted.trim().length === 0) {
      return null;
    }

    // Parse with error handling for circular references or invalid JSON
    let parsed: S3ConfigData;
    try {
      parsed = JSON.parse(decrypted) as S3ConfigData;
    } catch (parseError) {
      console.error("S3 config parse error:", parseError);
      return null;
    }

    // Validate required fields
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (!parsed.accessKeyId || !parsed.secretAccessKey || !parsed.region || !parsed.bucket) {
      // Missing required fields
      return null;
    }

    return {
      accessKeyId: String(parsed.accessKeyId),
      secretAccessKey: String(parsed.secretAccessKey),
      region: String(parsed.region),
      bucket: String(parsed.bucket),
    };
  } catch (error: unknown) {
    console.error("decryptS3Config unexpected error:", error);
    return null;
  }
};

export const clearSensitiveData = (data: string): void => {
  if (typeof data === "string") {
    // We can't actually null a string variable passed by value,
    // but we can try to wipe memory if it was a Buffer or similar.
    // For string, we just leave it as is or handle it via GC.
    // This function is mostly a placeholder in JS.
  }
};
