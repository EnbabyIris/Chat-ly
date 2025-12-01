'use client';

import { AnimatePresence } from 'framer-motion';
import { Login } from '@/components/auth/login';
import { Signup } from '@/components/auth/signup';

interface AuthFormContainerProps {
  activeTab: 'login' | 'signup';
  onSwitchToSignup: () => void;
  onSwitchToLogin: () => void;
}

export const AuthFormContainer = ({
  activeTab,
  onSwitchToSignup,
  onSwitchToLogin,
}: AuthFormContainerProps) => {
  return (
    <div className="mt-auto px-6  w-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'login' && (
          <Login key="login" onSwitchToSignup={onSwitchToSignup} />
        )}
        {activeTab === 'signup' && (
          <Signup key="signup" onSwitchToLogin={onSwitchToLogin} />
        )}
      </AnimatePresence>
    </div>
  );
};

