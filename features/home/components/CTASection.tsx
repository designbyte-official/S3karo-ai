"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-primary/80">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="h1 text-3xl sm:text-4xl lg:text-5xl text-primary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="body-1 text-lg sm:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust S3Karo for their file storage needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button className="h-[52px] px-8 rounded-full bg-card text-primary hover:bg-card/90 shadow-drop-1 body-2">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" className="h-[52px] px-8 rounded-full border-card text-primary-foreground hover:bg-card/10 shadow-drop-1 body-2">
                Sign In
              </Button>
            </Link>
          </div>
      </div>
    </section>
  );
};

