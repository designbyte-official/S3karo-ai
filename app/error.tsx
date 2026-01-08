"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light-400 p-4">
      <div className="max-w-md rounded-[20px] bg-white p-8 text-center shadow-drop-1">
        <h2 className="h2 mb-4 text-light-100">Something went wrong!</h2>
        <p className="body-2 mb-6 text-light-200">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-4">
          <Button
            onClick={reset}
            className="primary-btn flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="flex-1"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

