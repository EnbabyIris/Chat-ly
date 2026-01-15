'use client';

import { motion } from 'framer-motion';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ANIMATION_VARIANTS } from '@/lib/constants/animations';

interface LoginProps {
  onSwitchToSignup: () => void;
}

export const Login = ({ onSwitchToSignup }: LoginProps) => {
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
        placeholder="jack.sparrow@gmail.com"
        required
      />

      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="Enter password"
        showPasswordToggle
        required
      />

      <div className="w-5/6 mx-auto h-px bg-neutral-300 my-1"></div>

      <Button variant="primary">
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

