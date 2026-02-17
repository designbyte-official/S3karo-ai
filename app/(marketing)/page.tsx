import type { Metadata } from "next";

import {
  LandingNav,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  CTASection,
  LandingFooter,
} from "@/features/home/components";
import { generateMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMetadata({
  title: "A Better Way to Manage and Share S3 Storage",
  description:
    "Bring your own AWS S3 bucket or use managed storage. Multipart uploads, encrypted share links, built-in viewer, and image compression—without the usual S3 complexity.",
  keywords: [
    "S3 storage",
    "AWS S3 management",
    "file storage",
    "secure file sharing",
    "managed storage",
    "private S3",
    "multipart upload",
  ],
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
