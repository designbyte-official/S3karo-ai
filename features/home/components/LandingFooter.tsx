"use client";

import Link from "next/link";

import Logo from "@/components/common/Logo";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export const LandingFooter = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <footer className="bg-dark-200 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <Logo variant="full" href="/" />
            <p className="body-2 mt-4 max-w-sm text-white/70">
              Privacy-first file storage and sharing platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#features" className="body-2 text-white transition-colors hover:text-brand">
              Features
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="body-2 text-white transition-colors hover:text-brand">
                  Dashboard
                </Link>
                <Link href="/dashboard/profile" className="body-2 text-white transition-colors hover:text-brand">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-up" className="body-2 text-white transition-colors hover:text-brand">
                  Get Started
                </Link>
                <Link href="/sign-in" className="body-2 text-white transition-colors hover:text-brand">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="caption text-white/50">
            &copy; {new Date().getFullYear()} S3Karo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
