'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Shuffle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthInput } from './auth-input';
import { ProfilePictureUpload } from './profile-picture-upload';
import { useAuth } from '@/contexts/auth-context';
import { useRegisterForm } from '@/hooks/use-auth-form';
import { motion } from 'framer-motion';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register, error, clearError } = useAuth();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useRegisterForm(register);

  // Handle profile picture upload
  const handleAvatarChange = (avatarUrl: string) => {
    if (error) clearError();
    form.setFieldValue('avatar', avatarUrl);
  };

  // Generate random username suggestion
  const generateRandomUsername = () => {
    const adjectives = ['Cool', 'Swift', 'Bright', 'Quick', 'Smart', 'Bold', 'Calm', 'Wild', 'Free', 'Pure'];
    const nouns = ['Eagle', 'Tiger', 'Wolf', 'Bear', 'Lion', 'Fox', 'Owl', 'Hawk', 'Deer', 'Cat'];
    const numbers = Math.floor(Math.random() * 999) + 1;

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${noun}${numbers}`;
  };

  // Generate random password that meets requirements
  const generateRandomPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '!@#$%^&*';

    let password = '';
    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];

    // Fill remaining characters (minimum 8 total)
    const allChars = lowercase + uppercase + numbers + specials;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Generate random email
  const generateRandomEmail = (name: string) => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = Math.floor(Math.random() * 9999) + 1000;
    return `${name.toLowerCase().replace(/\s+/g, '')}${randomNum}@${domain}`;
  };

  // Handle random data generation for all fields
  const handleGenerateRandomData = () => {
    const randomName = generateRandomUsername();
    const randomPassword = generateRandomPassword();
    const randomEmail = generateRandomEmail(randomName);

    // Fill all form fields
    handleInputChange('name', randomName);
    handleInputChange('email', randomEmail);
    handleInputChange('password', randomPassword);
    handleInputChange('confirmPassword', randomPassword);
  };


  // Handle input change with error clearing
  const handleInputChange = (field: 'name' | 'email' | 'password' | 'confirmPassword' | 'avatar', value: string) => {
    if (error) clearError();
    form.setFieldValue(field as any, value);
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

        {/* Name Field with Profile Picture */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="name" className="block text-sm font-medium text-stone-700">
              Full Name
            </label>
            <button
              type="button"
              onClick={handleGenerateRandomData}
              disabled={form.isSubmitting}
              className="text-xs text-stone-500 hover:text-stone-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Generate random profile data"
            >
              <Shuffle className="w-3 h-3" />
              Random
            </button>
          </div>
          <div className="flex items-end gap-4">
            <ProfilePictureUpload
              value={form.values.avatar || ''}
              onChange={handleAvatarChange}
              error={form.errors.avatar}
              disabled={form.isSubmitting}
            />
            <div className="flex-1">
              <AuthInput
                id="name"
                label=""
                type="text"
                value={form.values.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                icon={User}
                error={form.errors.name}
                autoComplete="name"
                layoutId="name-field"
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <AuthInput
          id="email"
          label="Email Address"
          type="email"
          value={form.values.email}
          onChange={(value) => handleInputChange('email', value.toLowerCase())}
          placeholder="Enter your email"
          icon={Mail}
          error={form.errors.email}
          autoComplete="email"
          layoutId="email-field"
        /> 

        {/* Password Field */}
        <motion.div layoutId='password-field'>
          <AuthInput
            id="password"
            label="Password"
            type="password"
            value={form.values.password}
            onChange={(value) => handleInputChange('password', value)}
            placeholder="Create a strong password"
            icon={Lock}
            error={form.errors.password}
            autoComplete="new-password"
            layoutId="password-input"
          />
          
          {form.errors.password && (
            <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
          )}
        </motion.div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-stone-400" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.values.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`
                block w-full pl-10 pr-10 py-2 border rounded-xl
                focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent
                transition-colors text-neutral-400
                ${form.errors.confirmPassword
                  ? 'border-red-300 bg-red-50 text-neutral-900'
                  : 'border-stone-300 bg-neutral-100 hover:border-stone-400'
                }
              `}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              ) : (
                <Eye className="h-5 w-5 text-stone-400 hover:text-stone-600" />
              )}
            </button>
          </div>
          {form.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <motion.div
        layoutId='submit-button'
        > 
        <Button
          type="submit"
          variant="primary"
          disabled={!form.isValid || form.isSubmitting}
          loading={form.isSubmitting}
          loadingText="Creating Account..."
          className="w-full"
        >
          Create Account
        </Button>
        </motion.div>
      </form>

      {/* Switch to Login */}
      <div className="mt-4 text-center">
        <p className="text-neutral-400 text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            disabled={form.isSubmitting}
            className="text-neutral-400  hover:text-stone-700 font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}