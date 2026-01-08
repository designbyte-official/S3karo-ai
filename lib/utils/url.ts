/**
 * URL construction and normalization utilities
 * Centralized URL handling following DRY principle
 */

/**
 * Normalizes a base URL by removing trailing slashes
 */
export function normalizeBaseUrl(url: string | undefined | null): string {
  if (!url) return "";

  try {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, "");
    return urlObj.toString();
  } catch {
    // If URL parsing fails, just remove trailing slashes
    return url.trim().replace(/\/+$/, "");
  }
}

/**
 * Encodes a file key/path for use in URLs
 * Properly handles special characters, spaces, and edge cases
 */
export function encodeFileKey(key: string | undefined | null): string {
  if (!key || typeof key !== "string") return "";

  // Trim whitespace
  const trimmed = key.trim();
  if (!trimmed) return "";

  // Split by '/' to encode each segment separately (preserve path structure)
  const segments = trimmed.split("/");
  const encodedSegments = segments.map((segment, index) => {
    // Preserve empty segments only if they're not at the start/end (for proper path handling)
    if (!segment && (index === 0 || index === segments.length - 1)) {
      return "";
    }
    if (!segment) {
      return segment; // Preserve empty segments in the middle (double slashes)
    }
    // Encode each segment, but preserve '/' separators
    // Handle edge cases: already encoded segments, special characters
    try {
      return encodeURIComponent(segment);
    } catch (e) {
      // Fallback for invalid characters
      return segment.replace(/[^a-zA-Z0-9._-]/g, "_");
    }
  });

  // Filter out empty segments at start/end, but preserve structure
  const result = encodedSegments.join("/");
  return result;
}

/**
 * Constructs a complete file URL with proper encoding and normalization
 * Handles edge cases: empty keys, malformed URLs, special characters
 */
export function constructFileUrl(baseUrl: string, fileKey: string): string {
  // Edge case: empty base URL or file key
  if (!baseUrl || !fileKey) {
    return "";
  }

  try {
    const normalizedBase = normalizeBaseUrl(baseUrl);
    if (!normalizedBase) {
      return "";
    }

    const encodedKey = encodeFileKey(fileKey);
    if (!encodedKey) {
      return "";
    }

    // Remove leading slash from encoded key if base URL already has trailing slash
    const cleanKey = encodedKey.startsWith("/") ? encodedKey.slice(1) : encodedKey;

    // Final validation: ensure the constructed URL is valid
    const finalUrl = `${normalizedBase}${cleanKey}`;

    // Basic URL validation
    try {
      const _validUrl = new URL(finalUrl);
      return finalUrl;
    } catch {
      // Return anyway, let the browser handle it
      return finalUrl;
    }
  } catch (error) {
    console.error("constructFileUrl: Error constructing URL", { baseUrl, fileKey, error });
    return "";
  }
}
