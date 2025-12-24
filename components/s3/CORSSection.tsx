"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

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

export default function CORSSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CORS_CONFIG);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-4">
      <h3 className="h5 text-light-100">
        1. Configure CORS Policy
      </h3>
      <ol className="list-decimal list-inside space-y-2 body-2 text-light-200 ml-2">
        <li>Go to your <strong className="text-light-100">AWS S3 Console</strong></li>
        <li>Select your bucket → <strong className="text-light-100">Permissions</strong> tab</li>
        <li>Find <strong className="text-light-100">Cross-origin resource sharing (CORS)</strong></li>
        <li>Click <strong className="text-light-100">Edit</strong> and paste the JSON below</li>
      </ol>

      <div className="relative rounded-xl border border-light-300 bg-light-400/50 p-4 shadow-drop-1">
        <div className="flex justify-between items-center mb-3">
          <label className="subtitle-2 text-light-100">CORS Configuration</label>
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
        <pre className="caption text-light-100 overflow-x-auto bg-white/50 rounded-lg p-3 border border-light-300">
          <code>{CORS_CONFIG}</code>
        </pre>
      </div>
    </section>
  );
}

