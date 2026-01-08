"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-light-400 p-4">
          <div className="max-w-md rounded-[20px] bg-white p-8 text-center shadow-drop-1">
            <h2 className="h2 mb-4 text-light-100">Application Error</h2>
            <p className="body-2 mb-6 text-light-200">
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button onClick={reset} className="primary-btn w-full">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
