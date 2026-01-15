'use client';

import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRegisterForm, usePasswordStrength } from '@/hooks/use-auth-form';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { checkStrength } = usePasswordStrength();

  const form = useRegisterForm(register);

  // Password strength analysis
  const passwordStrength = form.values.password 
    ? checkStrength(form.values.password) 
    : null;

  // Handle input change with error clearing
  const handleInputChange = (field: 'name' | 'email' | 'password' | 'confirmPassword', value: string) => {
    if (error) clearError();
    form.setFieldValue(field, value);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Account
        </h1>
        <p className="text-gray-600">
          Join Chat-Turbo and start connecting with people
        </p>
      </div>

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

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="name"
              type="text"
              value={form.values.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${form.errors.name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>
          {form.errors.name && (
            <p className="mt-1 text-sm text-red-600">{form.errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={form.values.email}
              onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
              className={`
                block w-full pl-10 pr-3 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${form.errors.email 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          {form.errors.email && (
            <p className="mt-1 text-sm text-red-600">{form.errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.values.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`
                block w-full pl-10 pr-10 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${form.errors.password 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
                }
              `}
              placeholder="Create a strong password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {form.values.password && passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength:</span>
                <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                  style={{ width: `${passwordStrength.percentage}%` }}
                ></div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                  <div key={key} className={`flex items-center ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                    {passed ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    <span>
                      {key === 'length' && '8+ characters'}
                      {key === 'lowercase' && 'Lowercase'}
                      {key === 'uppercase' && 'Uppercase'}
                      {key === 'number' && 'Number'}
                      {key === 'special' && 'Special char'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {form.errors.password && (
            <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.values.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`
                block w-full pl-10 pr-10 py-3 border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${form.errors.confirmPassword 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
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
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {form.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!form.isValid || form.isSubmitting}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-all duration-200
            ${form.isValid && !form.isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
              : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          {form.isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}