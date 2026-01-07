import type { Metadata } from "next";
import {
    LandingNav,
    HeroSection,
    FeaturesSection,
    HowItWorksSection,
    CTASection,
    LandingFooter,
} from "@/features/home/components";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Home",
    description: "Store, Share & Manage Your Files Securely - Privacy-first file management platform with dual storage modes.",
    openGraph: {
        title: "S3Karo - Privacy-First File Storage",
        description: "Store, Share & Manage Your Files Securely with our privacy-first platform.",
        images: ["/thumbnail.webp"],
    },
};

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
