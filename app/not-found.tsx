import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light-400 p-4">
      <div className="max-w-md rounded-[20px] bg-white p-8 text-center shadow-drop-1">
        <h1 className="h1 mb-4 text-light-100">404</h1>
        <h2 className="h3 mb-4 text-light-100">Page Not Found</h2>
        <p className="body-2 mb-6 text-light-200">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Button asChild className="primary-btn flex-1">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

