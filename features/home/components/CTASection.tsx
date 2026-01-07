"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand to-brand-100 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Ready to Get Started?
        </h2>
        <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
          Join thousands of users who trust S3Karo for their file storage needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button className="h-[60px] px-12 rounded-full bg-white text-brand hover:bg-white/90 text-lg font-bold transition-all duration-300 hover:scale-105">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" className="h-[60px] px-12 rounded-full border-2 border-white text-white hover:bg-white/10 text-lg font-semibold transition-all duration-300">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
