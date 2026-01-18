'use client';

import { useState } from 'react';
import { Mail, Lock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthInput } from './auth-input';
import { useAuth } from '@/contexts/auth-context';
import { useLoginForm } from '@/hooks/use-auth-form';
import { motion } from 'framer-motion';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, error, isLoading, clearError } = useAuth();

  const form = useLoginForm(login);

  // Handle input change with error clearing
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (error) clearError();
    form.setFieldValue(field, value);
  };

  return (
    <div className="w-full max-w-md mx-auto">
  

      <form onSubmit={form.handleSubmit} className="space-y-6">
        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Email Field */}
        <AuthInput
          id="login-email"
          label="Email Address"
          type="email"
          value={form.values.email}
          onChange={(value) => handleInputChange('email', value.toLowerCase())}
          placeholder="Enter your email"
          icon={Mail}
          error={form.errors.email}
          autoComplete="email"
          disabled={isLoading}
          layoutId="email-field"
        />

        {/* Password Field */}
        <AuthInput
          id="login-password"
          label="Password"
          type="password"
          value={form.values.password}
          onChange={(value) => handleInputChange('password', value)}
          placeholder="Enter your password"
          icon={Lock}
          error={form.errors.password}
          autoComplete="current-password"
          disabled={isLoading}
          layoutId="password-field"
        />

        {/* Submit Button */}
        <motion.div
        layoutId='submit-button'
        > 
        <Button
          type="submit"
          variant="primary"
          disabled={!form.isValid || form.isSubmitting || isLoading}
          loading={form.isSubmitting || isLoading}
          loadingText="Signing in..."
          className="w-full"
          >
          Sign In
        </Button>
          </motion.div>
      </form>

      {/* Switch to Register */}
      <div className="mt-4 text-center">
        <p className="text-neutral-400 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            disabled={isLoading}
            className="text-neutral-400 hover:text-stone-700 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}