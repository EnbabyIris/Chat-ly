'use client';

import { motion } from 'framer-motion';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ANIMATION_VARIANTS } from '@/lib/constants/animations';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export const Signup = ({ onSwitchToLogin }: SignupProps) => {
  const { spring, duration } = useAnimationConfig();

  return (
    <motion.div
      className="flex flex-col gap-4 w-full"
      {...ANIMATION_VARIANTS.slideRight}
      transition={{
        ...spring,
        duration: duration.medium,
      }}
    >
      <Input
        id="name"
        label="Name"
        type="text"
        placeholder="jack sparrow"
        required
      />

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
        placeholder="Enter Password"
        showPasswordToggle
        required
      />

      <Input
        id="confirm-password"
        label="Confirm Password"
        type="password"
        placeholder="Confirm Password"
        showPasswordToggle
        required
      />

      <div className="w-full">
        <label
          htmlFor="pic"
          className="block text-gray-500 mb-1 text-sm font-medium font-inter"
        >
          Upload your Picture
        </label>
        <input
          id="pic"
          type="file"
          accept="image/*"
          className="shadow-[inset_0px_1px_1] font-inter text-sm w-full px-3 py-2 text-neutral-400 bg-neutral-100 rounded-lg outline-none focus:outline-none focus-visible:outline-none active:outline-none focus:ring-0 focus-visible:ring-0 border border-neutral-200/70 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neutral-200 file:text-neutral-600 hover:file:bg-neutral-300 file:cursor-pointer file:transition-colors"
        />
      </div>

      <div className="w-5/6 mx-auto h-px bg-neutral-300 my-1"></div>

      <div className="flex gap-2">
        <Button variant="primary" className="flex-1">
          Sign Up
        </Button>
        <Button variant="white" className="flex-1 max-w-32 text-neutral-500">
          Random
        </Button>
      </div>

      {onSwitchToLogin && (
        <div className="text-center text-sm text-gray-400">
          <button
            onClick={onSwitchToLogin}
            className="underline font-saira hover:text-gray-300 transition-colors"
          >
            Already have an account?
          </button>
        </div>
      )}
    </motion.div>
  );
};

