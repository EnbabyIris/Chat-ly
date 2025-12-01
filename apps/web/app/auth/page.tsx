'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { AnimatePresence } from 'framer-motion';
import { LeftSection } from '@/components/auth/left-section';
import { LogoSection } from '@/components/auth/logo-section';
import { AuthFormContainer } from '@/components/auth/auth-form-container';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push('/chats');
    }
  }, [user, router]);

  return (
    <div className="w-full gap-6 h-screen bg-stone-100 flex p-6 relative">
      <LeftSection />

      <div className="w-[30%] mx-auto shadow-xl rounded-xl bg-white flex flex-col border-2 border-neutral-200/70 ring-2 relative ring-black/10 items-center justify-center py-6 mt-[72px] mb-[72px]">
        <AnimatePresence mode="wait">
          {activeTab === 'login' && <LogoSection key="logo" />}
        </AnimatePresence>

        <AuthFormContainer
          activeTab={activeTab}
          onSwitchToSignup={() => setActiveTab('signup')}
          onSwitchToLogin={() => setActiveTab('login')}
        />
      </div>
    </div>
  );
}

