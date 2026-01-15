'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeftSection } from '@/components/auth/left-section';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/contexts/auth-context';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/chats');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full gap-6 h-screen bg-stone-100 flex p-6 relative">
      <LeftSection />

      <div className="w-[30%] mx-auto shadow-xl rounded-xl bg-white flex flex-col border-2 border-neutral-200/70 ring-2 relative ring-black/10 items-center justify-center py-6 mt-[72px] mb-[72px]">
        <div className="w-full max-w-md px-8">
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

