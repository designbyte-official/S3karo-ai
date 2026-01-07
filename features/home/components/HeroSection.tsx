"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-75/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto max-w-7xl">
        {/* Hero Content */}
        <div className="text-center space-y-8 mb-16 lg:mb-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-50 text-brand subtitle-2">
            <span className="w-2 h-2 bg-brand rounded-full animate-pulse"></span>
            Privacy-First File Storage
          </div>

          {/* Main Heading - HUGE */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-dark-100 leading-[1.1]">
            Store, Share & Manage
            <br />
            <span className="text-brand">Your Files Securely</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl lg:text-3xl text-light-100 max-w-4xl mx-auto leading-relaxed font-normal">
            A powerful, privacy-first file management platform. Use our Managed Storage tier or bring your Own S3 bucket.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
            <Link href="/sign-up">
              <Button className="primary-btn h-[60px] px-10 text-lg font-semibold">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="h-[60px] px-10 rounded-full button text-lg font-semibold bg-white hover:bg-light-300 border-2 border-light-200">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual - File Cards */}
        <div className="relative">
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-50 via-brand-75/30 to-white p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Project Proposal.pdf", size: "2.4 MB", color: "from-brand to-brand-100" },
                { name: "Design Assets.zip", size: "15.8 MB", color: "from-orange to-orange/80" },
                { name: "Team Photo.jpg", size: "4.2 MB", color: "from-green to-green/80" }
              ].map((file, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 transition-all duration-300 hover:scale-105 group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${file.color} rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="subtitle-1 text-dark-100 mb-2 font-semibold">{file.name}</h3>
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
