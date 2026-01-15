'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLoginForm } from '@/hooks/use-auth-form';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useLoginForm(login);

  // Handle input change with error clearing
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (error) clearError();
    form.setFieldValue(field, value);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600">
          Sign in to your Chat-Turbo account
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
              autoFocus
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
              placeholder="Enter your password"
              autoComplete="current-password"
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
          {form.errors.password && (
            <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => {
              // TODO: Implement forgot password functionality
              alert('Forgot password functionality will be implemented soon!');
            }}
          >
            Forgot password?
          </button>
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
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create account
          </button>
        </p>
      </div>

      {/* Demo Credentials (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-2">Demo Credentials:</p>
          <div className="text-xs text-yellow-700 space-y-1">
            <p>Email: demo@chatturbo.com</p>
            <p>Password: DemoPassword123!</p>
            <button
              type="button"
              onClick={() => {
                form.setFieldValue('email', 'demo@chatturbo.com');
                form.setFieldValue('password', 'DemoPassword123!');
              }}
              className="mt-2 text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded"
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>
      )}
    </div>
  );
}