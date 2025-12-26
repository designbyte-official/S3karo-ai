"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";

export const LandingFooter = () => {
  return (
    <footer className="bg-dark-200 text-light-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo variant="full" textColor="white" href="/" />
            <p className="mt-4 body-2 text-light-200/70">
              Privacy-first file storage and sharing platform.
            </p>
          </div>
          <div>
            <h4 className="h5 text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="body-2 text-light-200/70 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/dashboard" className="body-2 text-light-200/70 hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/sign-up" className="body-2 text-light-200/70 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="h5 text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="h5 text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="#" className="body-2 text-light-200/70 hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-light-100/10 pt-8 text-center">
          <p className="caption text-light-200/50">&copy; {new Date().getFullYear()} S3Karo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

