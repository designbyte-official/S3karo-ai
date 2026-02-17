
import { compressImage } from './compressor';
import { CompressionSettings } from './types';

export interface ProcessingResult {
    blob: Blob;
    width: number;
    height: number;
    isOriginal: boolean;
}

export class ImageOptimizerService {
    /**
     * Processes an image file according to settings, with built-in protection against size inflation.
     */
    static async processImage(
        file: File,
        settings: CompressionSettings,
        originalUrl: string
    ): Promise<ProcessingResult> {
        try {
            const result = await compressImage(file, settings);

            // Strict regression check:
            // If the "compressed" file is larger than the original, we should probably keep the original.
            // This happens often with PNGs in browser canvases or when "quality" is high.
            // We only fallback if strict format conversion isn't forced to a DIFFERENT format.
            // e.g. If user wants PNG -> JPEG, we might accept a size increase (unlikely but possible).
            // But if PNG -> PNG or Original -> Original, we surely want the smaller one.

            const isFormatConversion =
                settings.format !== 'original' &&
                file.type !== settings.format &&
                // specialized check for jpg/jpeg alias
                !(file.type === 'image/jpeg' && (settings.format as string) === 'image/jpg') &&
                !(file.type === 'image/jpg' && (settings.format as string) === 'image/jpeg');

            // If we are keeping the same format (or "original"), AND the size increased
            if (!isFormatConversion && result.blob.size > file.size) {
                // Check if dimensions were changed. If they were, the user might WANT the resized version even if bigger (rare).
                // But usually, resizing down should make it smaller. Resizing UP is rare.
                // Let's assume if size increased, it's a regression in compression efficiency.

                const dimsChanged = result.width !== 0 && result.height !== 0 && // 0 means not tracked? No, result.width usually populated
                    (settings.maxWidth > 0 || settings.maxHeight > 0);

                // Note: compressImage returns actual width/height of result.
                // If we didn't resize, we can safely fallback.

                console.warn(`[ImageOptimizer] Regression detected: ${result.blob.size} > ${file.size}. Reverting to original.`);

                return {
                    blob: file,
                    width: result.width, // We might not know original dims easily without loading it, but result.width should be close if no resize
                    height: result.height,
                    isOriginal: true
                };
            }

            return {
                blob: result.blob,
                width: result.width,
                height: result.height,
                isOriginal: false
            };

        } catch (error) {
            console.error('[ImageOptimizer] Compression failed:', error);
            throw error;
        }
    }
}
