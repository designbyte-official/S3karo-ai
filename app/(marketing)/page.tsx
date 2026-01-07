import type { Metadata } from "next";
import { generateMetadata } from "@/lib/seo/metadata";
import {
    LandingNav,
    HeroSection,
    FeaturesSection,
    HowItWorksSection,
    CTASection,
    LandingFooter,
} from "@/features/home/components";

export const dynamic = "force-dynamic";

export const metadata: Metadata = generateMetadata({
    title: "Home",
    description: "Store, Share & Manage Your Files Securely - Privacy-first file management platform with dual storage modes.",
    keywords: [
        "privacy-first storage",
        "secure file sharing",
        "dual storage modes",
        "managed storage",
        "private S3",
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
