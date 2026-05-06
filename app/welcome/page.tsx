import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturedOutfits } from "@/components/landing/FeaturedOutfits";
import { LifestyleBanner } from "@/components/landing/LifestyleBanner";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TopCreators } from "@/components/landing/TopCreators";
import { CtaBanner } from "@/components/landing/CtaBanner";

export default function WelcomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturedOutfits />
        <LifestyleBanner />
        <HowItWorks />
        <TopCreators />
        <CtaBanner />
      </main>
    </>
  );
}
