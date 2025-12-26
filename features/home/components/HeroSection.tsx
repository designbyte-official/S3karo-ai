"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 text-brand body-2 mb-4 shadow-drop-1">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse"></span>
            Privacy-First File Storage
          </div>
          <h1 className="h1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-dark-200">
            Store, Share & Manage
            <br />
            <span className="text-brand">Your Files Securely</span>
          </h1>
          <p className="body-1 text-lg sm:text-xl lg:text-2xl text-light-100 max-w-3xl mx-auto leading-relaxed">
            A powerful, privacy-first file management platform. Use our Managed Storage tier or bring your Own S3 bucket.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <Button className="h-[52px] px-8 rounded-full bg-brand text-white hover:bg-brand-100 shadow-drop-1 body-2">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="h-[52px] px-8 rounded-full border-light-300 shadow-drop-1 body-2">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-16 lg:mt-24 relative">
          <div className="relative rounded-[20px] bg-gradient-to-br from-brand/10 via-brand/5 to-transparent p-8 lg:p-12 border border-brand/20 shadow-drop-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-drop-1 border border-light-300 hover:shadow-drop-2 transition-all">
                  <div className="w-12 h-12 bg-brand/10 rounded-xl mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="h5 text-dark-200 mb-2">File {i}</h3>
                  <p className="body-2 text-light-200">2.4 MB</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

