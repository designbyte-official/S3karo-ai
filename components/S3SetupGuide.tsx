"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

const CORS_CONFIG = `[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "${typeof window !== 'undefined' ? window.location.origin : '*'}"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]`;

const IAM_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject",
        "s3:CopyObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME"
      ]
    }
  ]
}`;

interface S3SetupGuideProps {
  isOpen: boolean;
  onClose: () => void;
  bucketName?: string;
}

const S3SetupGuide = ({ isOpen, onClose, bucketName }: S3SetupGuideProps) => {
  const [copiedCORS, setCopiedCORS] = useState(false);
  const [copiedIAM, setCopiedIAM] = useState(false);

  const handleCopyCORS = () => {
    navigator.clipboard.writeText(CORS_CONFIG);
    setCopiedCORS(true);
    setTimeout(() => setCopiedCORS(false), 2000);
  };

  const handleCopyIAM = () => {
    const policy = IAM_POLICY.replace(/YOUR_BUCKET_NAME/g, bucketName || 'YOUR_BUCKET_NAME');
    navigator.clipboard.writeText(policy);
    setCopiedIAM(true);
    setTimeout(() => setCopiedIAM(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="shad-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-light-100 text-xl">
            AWS S3 Setup Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* CORS Configuration */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-light-100">
              1. Configure CORS Policy
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-light-200 text-sm">
              <li>Go to your <strong className="text-light-100">AWS S3 Console</strong></li>
              <li>Select your bucket → <strong className="text-light-100">Permissions</strong> tab</li>
              <li>Find <strong className="text-light-100">Cross-origin resource sharing (CORS)</strong></li>
              <li>Click <strong className="text-light-100">Edit</strong> and paste the JSON below</li>
            </ol>

            <div className="relative bg-light-800 rounded-lg p-4 border border-light-400">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-light-200">CORS Configuration</label>
                <Button
                  type="button"
                  onClick={handleCopyCORS}
                  className="h-8 px-3 text-xs bg-primary-500 hover:bg-primary-600"
                >
                  {copiedCORS ? (
                    <>
                      <span className="mr-1">✓</span>
                      Copied
                    </>
                  ) : (
                    <>
                      <span className="mr-1">📋</span>
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-light-300 overflow-x-auto">
                <code>{CORS_CONFIG}</code>
              </pre>
            </div>
          </section>

          {/* IAM Permissions */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-light-100">
              2. Required IAM Permissions
            </h3>
            <p className="text-sm text-light-200">
              Your AWS credentials need these S3 permissions:
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:DeleteObject', 's3:HeadObject', 's3:CopyObject'].map((permission) => (
                <span
                  key={permission}
                  className="px-3 py-1 bg-primary-500/20 text-primary-300 text-xs rounded-md border border-primary-500/30"
                >
                  {permission}
                </span>
              ))}
            </div>

            <div className="relative bg-light-800 rounded-lg p-4 border border-light-400">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-light-200">IAM Policy JSON</label>
                <Button
                  type="button"
                  onClick={handleCopyIAM}
                  className="h-8 px-3 text-xs bg-primary-500 hover:bg-primary-600"
                >
                  {copiedIAM ? (
                    <>
                      <span className="mr-1">✓</span>
                      Copied
                    </>
                  ) : (
                    <>
                      <span className="mr-1">📋</span>
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-light-300 overflow-x-auto">
                <code>{IAM_POLICY.replace(/YOUR_BUCKET_NAME/g, bucketName || 'YOUR_BUCKET_NAME')}</code>
              </pre>
              <p className="text-xs text-light-400 mt-2">
                Replace <code className="bg-light-700 px-1 rounded">YOUR_BUCKET_NAME</code> with your actual bucket name
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                <strong>Note:</strong> Create an IAM user in AWS Console, attach this policy, and use the Access Key ID and Secret Access Key in the configuration above.
              </p>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="modal-submit-button">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default S3SetupGuide;

