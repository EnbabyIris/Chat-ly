'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ANIMATION_VARIANTS } from '@/lib/constants/animations';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export const Signup = ({ onSwitchToLogin }: SignupProps) => {
  const { handleSignup, loading } = useAuth();
  const { uploadImage, isUploading } = useCloudinaryUpload();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pic, setPic] = useState('');

  const submitHandler = async () => {
    try {
      await handleSignup({ name, email, password, confirmPassword, pic });
    } catch (error) {
      // Error is already handled in useAuth hook
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) setPic(url);
    }
  };

  const generateRandomData = () => {
    const firstNames = [
      'John',
      'Jane',
      'Alex',
      'Sarah',
      'Mike',
      'Emma',
      'David',
      'Lisa',
      'Chris',
      'Anna',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Wilson',
      'Moore',
    ];
    const randomFirstName =
      firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName =
      lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomName = `${randomFirstName} ${randomLastName}`;

    const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const randomEmail = `${randomFirstName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${randomDomain}`;

    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomPassword = '';
    for (let i = 0; i < 10; i++) {
      randomPassword += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    setName(randomName);
    setEmail(randomEmail);
    setPassword(randomPassword);
    setConfirmPassword(randomPassword);
  };

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
        value={name}
        placeholder="jack sparrow"
        onChange={(e) => setName(e.target.value)}
        required
      />

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
        placeholder="Enter Password"
        onChange={(e) => setPassword(e.target.value)}
        showPasswordToggle
        required
      />

      <Input
        id="confirm-password"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        placeholder="Confirm Password"
        onChange={(e) => setConfirmPassword(e.target.value)}
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
          onChange={handleFileChange}
          className="shadow-[inset_0px_1px_1] font-inter text-sm w-full px-3 py-2 text-neutral-400 bg-neutral-100 rounded-lg outline-none focus:outline-none focus-visible:outline-none active:outline-none focus:ring-0 focus-visible:ring-0 border border-neutral-200/70 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neutral-200 file:text-neutral-600 hover:file:bg-neutral-300 file:cursor-pointer file:transition-colors"
        />
      </div>

      <div className="w-5/6 mx-auto h-px bg-neutral-300 my-1"></div>

      <div className="flex gap-2">
        <Button
          onClick={submitHandler}
          loading={loading || isUploading}
          loadingText={isUploading ? 'Uploading...' : 'Signing up...'}
          variant="primary"
          className="flex-1"
        >
          Sign Up
        </Button>
        <Button
          onClick={generateRandomData}
          variant="white"
          className="flex-1 max-w-32 text-neutral-500"
        >
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

