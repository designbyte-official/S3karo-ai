"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";

export const LandingFooter = () => {
  return (
    <footer className="bg-popover text-popover-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo variant="full" textColor="white" href="/" />
            <p className="mt-4 body-2 text-muted-foreground">
              Privacy-first file storage and sharing platform.
            </p>
          </div>
          <div>
            <h4 className="h5 text-popover-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Features</Link></li>
              <li><Link href="/dashboard" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/sign-up" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="h5 text-popover-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">About</Link></li>
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Blog</Link></li>
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="h5 text-popover-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Privacy</Link></li>
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Terms</Link></li>
              <li><Link href="#" className="body-2 text-muted-foreground hover:text-popover-foreground transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8 text-center">
          <p className="caption text-muted-foreground">&copy; {new Date().getFullYear()} S3Karo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

