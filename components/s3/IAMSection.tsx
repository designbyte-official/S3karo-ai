"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

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

const PERMISSIONS = [
  's3:GetObject',
  's3:PutObject',
  's3:ListBucket',
  's3:DeleteObject',
  's3:HeadObject',
  's3:CopyObject'
];

interface IAMSectionProps {
  bucketName?: string;
}

export default function IAMSection({ bucketName }: IAMSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const policy = IAM_POLICY.replace(/YOUR_BUCKET_NAME/g, bucketName || 'YOUR_BUCKET_NAME');
    navigator.clipboard.writeText(policy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const policyText = IAM_POLICY.replace(/YOUR_BUCKET_NAME/g, bucketName || 'YOUR_BUCKET_NAME');

  return (
    <section className="space-y-4">
      <h3 className="h5 text-light-100">
        2. Required IAM Permissions
      </h3>
      <p className="body-2 text-light-200">
        Your AWS credentials need these S3 permissions:
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {PERMISSIONS.map((permission) => (
          <span
            key={permission}
            className="caption px-3 py-1.5 bg-brand/10 text-brand-100 rounded-full border border-brand/30"
          >
            {permission}
          </span>
        ))}
      </div>

      <div className="relative rounded-xl border border-light-300 bg-light-400/50 p-4 shadow-drop-1">
        <div className="flex justify-between items-center mb-3">
          <label className="subtitle-2 text-light-100">IAM Policy JSON</label>
          <Button
            type="button"
            onClick={handleCopy}
            className="button h-8 px-3 rounded-full bg-brand hover:bg-brand-100 text-white shadow-drop-1"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre className="caption text-light-100 overflow-x-auto bg-white/50 rounded-lg p-3 border border-light-300 mb-3">
          <code>{policyText}</code>
        </pre>
        <p className="caption text-light-200">
          Replace <code className="bg-white/50 px-1.5 py-0.5 rounded border border-light-300 text-brand-100">YOUR_BUCKET_NAME</code> with your actual bucket name
        </p>
      </div>

      <div className="rounded-xl border border-blue/30 bg-blue/10 p-4">
        <p className="caption text-blue">
          <strong className="text-light-100">Note:</strong> Create an IAM user in AWS Console, attach this policy, and use the Access Key ID and Secret Access Key in the configuration above.
        </p>
      </div>
    </section>
  );
}

