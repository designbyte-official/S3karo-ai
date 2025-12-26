import {
    LandingNav,
    HeroSection,
    FeaturesSection,
    HowItWorksSection,
    CTASection,
    LandingFooter,
} from "@/features/home/components";

export const dynamic = "force-dynamic";

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

