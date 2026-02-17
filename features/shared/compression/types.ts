export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'original';

export interface CompressionSettings {
  quality: number;
  format: ImageFormat;
  maxWidth: number;
  maxHeight: number;
  maintainAspectRatio: boolean;
  prefix: string;
  stripMetadata: boolean;
}

export interface CompressedFile {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  originalType: string;
  originalUrl: string;
  compressedSize: number;
  compressedUrl: string;
  width: number;
  height: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  settings: CompressionSettings;
}

export interface Stats {
  totalOriginalSize: number;
  totalCompressedSize: number;
  filesCount: number;
  processedCount: number;
}
