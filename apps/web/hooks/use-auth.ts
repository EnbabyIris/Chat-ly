'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      toast.success('Login successful!');
      router.push('/chats');
    } catch (error) {
      toast.error('Login failed', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    pic?: string;
  }) => {
    setLoading(true);
    try {
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      toast.success('Signup successful!');
      router.push('/chats');
    } catch (error) {
      toast.error('Signup failed', {
        description:
          error instanceof Error ? error.message : 'Please try again',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    handleSignup,
    loading,
  };
};

