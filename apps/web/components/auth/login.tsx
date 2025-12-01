'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ANIMATION_VARIANTS } from '@/lib/constants/animations';

interface LoginProps {
  onSwitchToSignup: () => void;
}

export const Login = ({ onSwitchToSignup }: LoginProps) => {
  const { handleLogin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitHandler = async () => {
    await handleLogin(email, password);
  };

  const { spring, duration } = useAnimationConfig();

  return (
    <motion.div
      className="flex flex-col gap-4 w-full h-full"
      {...ANIMATION_VARIANTS.slideLeft}
      transition={{
        ...spring,
        duration: duration.medium,
      }}
    >
      <Input
        id="email"
        label="Email Address"
        type="email"
        value={email}
        placeholder="jack.sparrow@gmail.com"
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        placeholder="Enter password"
        onChange={(e) => setPassword(e.target.value)}
        showPasswordToggle
        required
      />

      <div className="w-5/6 mx-auto h-px bg-neutral-300 my-1"></div>

      <Button
        onClick={submitHandler}
        loading={loading}
        loadingText="Loading..."
        variant="primary"
      >
        Login
      </Button>

      {onSwitchToSignup && (
        <div className="text-center text-sm text-gray-400">
          <button
            onClick={onSwitchToSignup}
            className="underline hover:text-gray-300 transition-colors"
          >
            Don't have an account?
          </button>
        </div>
      )}
    </motion.div>
  );
};

