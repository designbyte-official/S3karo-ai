"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-white px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
      {/* Background Gradient Orbs - design system brand */}
      <div className="absolute right-0 top-0 -z-10 size-[600px] rounded-full bg-brand-50 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 size-[500px] rounded-full bg-brand-75/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 -z-10 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue/5 blur-3xl" />

      <div className="container mx-auto max-w-7xl">
        {/* Hero Content */}
        <div className="mb-16 space-y-8 text-center lg:mb-20">
          {/* Badge */}
          <div className="subtitle-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-5 py-2.5 text-brand">
            <span className="size-2 animate-pulse rounded-full bg-brand"></span>
            Your S3, Simplified
          </div>

          {/* Main Heading - HUGE */}
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-dark-100 sm:text-6xl md:text-7xl lg:text-8xl">
            A Better Way to Manage
            <br />
            <span className="bg-gradient-to-r from-brand to-brand-100 bg-clip-text text-transparent">and Share S3 Storage</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-4xl text-xl font-normal leading-relaxed text-light-100 sm:text-2xl lg:text-3xl">
            Bring your own AWS bucket or use our managed storage. Clean interface, multipart uploads,
            encrypted share links, and full control—without the usual S3 complexity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-5 pt-4 sm:flex-row">
            <Link href="/sign-up">
              <Button className="primary-btn h-[60px] px-10 text-lg font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                className="button h-[60px] rounded-full border-2 border-light-200 bg-white px-10 text-lg font-semibold text-dark-100 hover:border-brand/30 hover:bg-brand-50 hover:text-brand"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual - Thumbnail */}
        <div className="relative mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-light-300 p-2 lg:p-3">
            <Image
              src="/assets/thumbnails/3.webp"
              alt="S3Karo - Manage and share S3 storage"
              width={1200}
              height={630}
              className="w-full rounded-2xl object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
