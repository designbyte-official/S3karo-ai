"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-white px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
      {/* Background Gradient Orbs */}
      <div className="absolute right-0 top-0 -z-10 size-[600px] rounded-full bg-brand/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 size-[500px] rounded-full bg-brand-75/10 blur-3xl"></div>

      <div className="container mx-auto max-w-7xl">
        {/* Hero Content */}
        <div className="mb-16 space-y-8 text-center lg:mb-20">
          {/* Badge */}
          <div className="subtitle-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-5 py-2.5 text-brand">
            <span className="size-2 animate-pulse rounded-full bg-brand"></span>
            Privacy-First File Storage
          </div>

          {/* Main Heading - HUGE */}
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-dark-100 sm:text-6xl md:text-7xl lg:text-8xl">
            Store, Share & Manage
            <br />
            <span className="text-brand">Your Files Securely</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto max-w-4xl text-xl font-normal leading-relaxed text-light-100 sm:text-2xl lg:text-3xl">
            A powerful, privacy-first file management platform. Use our Managed Storage tier or
            bring your Own S3 bucket.
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
                className="button h-[60px] rounded-full border-2 border-light-200 bg-white px-10 text-lg font-semibold hover:bg-light-300"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual - File Cards */}
        <div className="relative">
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-50 via-brand-75/30 to-white p-8 lg:p-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { name: "Project Proposal.pdf", size: "2.4 MB", color: "from-brand to-brand-100" },
                { name: "Design Assets.zip", size: "15.8 MB", color: "from-orange to-orange/80" },
                { name: "Team Photo.jpg", size: "4.2 MB", color: "from-green to-green/80" },
              ].map((file, i) => (
                <div
                  key={i}
                  className="group rounded-2xl bg-white p-8 transition-all duration-300 hover:scale-105"
                >
                  <div
                    className={`size-16 bg-gradient-to-br ${file.color} mb-6 flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110`}
                  >
                    <svg
                      className="size-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="subtitle-1 mb-2 font-semibold text-dark-100">{file.name}</h3>
                  <p className="body-2 text-light-100">{file.size}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
