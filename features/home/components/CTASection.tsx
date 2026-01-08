"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export const CTASection = () => {
  const user = useAuthStore((state) => state.user);
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-100 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
      {/* Decorative Elements */}
      <div className="absolute left-0 top-0 size-96 rounded-full bg-white/5 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 size-96 rounded-full bg-white/5 blur-3xl"></div>

      <div className="container relative z-10 mx-auto max-w-5xl text-center">
        <h2 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Ready to Get Started?
        </h2>
        <p className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-white/90 sm:text-2xl lg:text-3xl">
          Join thousands of users who trust S3Karo for their file storage needs.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button className="h-[60px] rounded-full bg-white px-12 text-lg font-bold text-brand transition-all duration-300 hover:scale-105 hover:bg-white/90">
                  Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button className="h-[60px] rounded-full border-2 border-white bg-transparent px-12 text-lg font-semibold text-white transition-all duration-300 hover:bg-white hover:text-brand">
                  View Profile
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-up">
                <Button className="h-[60px] rounded-full bg-white px-12 text-lg font-bold text-brand transition-all duration-300 hover:scale-105 hover:bg-white/90">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button className="h-[60px] rounded-full border-2 border-white bg-transparent px-12 text-lg font-semibold text-white transition-all duration-300 hover:bg-white hover:text-brand">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
