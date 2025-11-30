import { BackgroundLines } from '@/components/landing/background-lines';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { QuoteSection } from '@/components/landing/quote-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="relative bg-white min-h-screen w-screen overflow-hidden xl:px-16">
      <Navbar />
      <BackgroundLines />
      <div className="h-full w-full px-6 py-16 md:px-16">
        <HeroSection />
        <FeaturesSection />
        <QuoteSection />
      </div>
      <Footer />
    </div>
  );
}
