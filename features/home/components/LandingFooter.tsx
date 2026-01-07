"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";

export const LandingFooter = () => {
  return (
    <footer className="bg-dark-200 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Logo and Description */}
          <div className="text-center md:text-left">
            <Logo variant="full" href="/" />
            <p className="mt-4 body-2 text-white/70 max-w-sm">
              Privacy-first file storage and sharing platform.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="#features" className="body-2 text-white hover:text-brand transition-colors">
              Features
            </Link>
            <Link href="/sign-up" className="body-2 text-white hover:text-brand transition-colors">
              Get Started
            </Link>
            <Link href="/sign-in" className="body-2 text-white hover:text-brand transition-colors">
              Sign In
            </Link>
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
