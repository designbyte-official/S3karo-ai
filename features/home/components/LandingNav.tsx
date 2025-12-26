"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";

export const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-drop-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Logo variant="full" href="/" />
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="h-[52px] px-6 rounded-full body-2">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="h-[52px] px-8 rounded-full bg-brand text-primary-foreground hover:bg-brand-100 shadow-drop-1 body-2">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

