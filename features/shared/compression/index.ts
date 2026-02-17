import { ImageOptimizerService } from "./image-optimizer.service";
import type { CompressionSettings } from "./types";

export { ImageOptimizerService } from "./image-optimizer.service";
export { compressImage, formatSize, isAvifSupported } from "./compressor";
export type {
  CompressionSettings,
  CompressedFile,
  ImageFormat,
  Stats,
} from "./types";

export const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
  quality: 0.85,
  format: "original",
  maxWidth: 1920,
  maxHeight: 1920,
  maintainAspectRatio: true,
  prefix: "",
  stripMetadata: true,
};

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * If the file is an image and compression is enabled, compresses it and returns a new File.
 * Otherwise returns the original file. Used before S3 upload.
 */
export async function maybeCompressImage(
  file: File,
  options: { compress: boolean; settings?: Partial<CompressionSettings> }
): Promise<File> {
  if (!options.compress || !isImageFile(file)) return file;
  const settings: CompressionSettings = {
    ...DEFAULT_COMPRESSION_SETTINGS,
    ...options.settings,
  };
  const originalUrl = URL.createObjectURL(file);
  try {
    const result = await ImageOptimizerService.processImage(file, settings, originalUrl);
    const ext = result.blob.type === "image/png" ? "png" : result.blob.type === "image/webp" ? "webp" : result.blob.type === "image/avif" ? "avif" : "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const newName = `${baseName}.${ext}`;
    return new File([result.blob], newName, { type: result.blob.type });
  } finally {
    URL.revokeObjectURL(originalUrl);
  }
}
