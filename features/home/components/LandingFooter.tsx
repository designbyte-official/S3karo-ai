"use client";

import Link from "next/link";

import Logo from "@/components/common/Logo";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export const LandingFooter = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <footer className="border-t border-white/10 bg-dark-200 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <Logo variant="full" href="/" />
            <p className="body-2 mt-4 max-w-sm text-white/70">
              A better way to manage and share S3 storage—your bucket or ours, you stay in control.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#features" className="body-2 text-white transition-colors hover:text-brand">
              Features
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="body-2 text-white transition-colors hover:text-brand"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="body-2 text-white transition-colors hover:text-brand"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="body-2 text-white transition-colors hover:text-brand"
                >
                  Get Started
                </Link>
                <Link
                  href="/sign-in"
                  className="body-2 text-white transition-colors hover:text-brand"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Copyright & Powered by */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-between sm:gap-4">
            <p className="caption text-white/50">
              &copy; {new Date().getFullYear()} S3Karo. All rights reserved.
            </p>
            <p className="caption text-white/50">
              Powered by{" "}
              <a
                href="https://studio.designbyte.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/80 transition-colors hover:text-brand"
              >
                Designbyte Studio
              </a>
              {" · "}
              <a
                href="https://studio.designbyte.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/80 transition-colors hover:text-brand"
              >
                studio.designbyte.dev
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
