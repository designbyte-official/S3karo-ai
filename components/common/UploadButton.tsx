'use client';

import { useRef } from 'react';

import { Upload, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUpload } from '@/features/managed-storage/hooks/use-upload';

export interface UploadButtonProps {
  path?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadComplete?: (files: any[]) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * S3-Karo upload button component
 * 
 * Usage:
 * <UploadButton 
 *   path="documents/2024/"
 *   onUploadComplete={(files) => console.log(files)}
 * />
 */
export function UploadButton({
  path = '',
  maxFileSize,
  allowedFileTypes,
  onUploadComplete,
  className,
  children,
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultiple, isUploading } = useUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadedFiles = await uploadMultiple(files, {
        path,
        maxFileSize,
        allowedFileTypes,
        onSuccess: (file) => {
          // console.log('Uploaded:', file);
        },
      });

      onUploadComplete?.(uploadedFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept={allowedFileTypes?.filter(t => t !== '*').join(',')}
      />
      <Button
        onClick={handleClick}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            {children || 'Upload Files'}
          </>
        )}
      </Button>
    </>
  );
}

