'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { BackgroundLines } from '@/components/landing/background-lines';
import { Navbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { QuoteSection } from '@/components/landing/quote-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to chats
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chats');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

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
