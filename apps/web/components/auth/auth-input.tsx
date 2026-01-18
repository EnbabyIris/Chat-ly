'use client';

import { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthInputProps {
  id: string;
  label?: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
  layoutId: string;
}

export function AuthInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  disabled = false,
  layoutId,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <motion.div layoutId={layoutId}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-stone-400" />
        </div>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            block w-full ${isPassword ? 'pr-10' : 'pr-3'} pl-10 py-2 border rounded-xl
            focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent
            transition-colors text-neutral-400
            ${error
              ? 'border-red-300 bg-red-50 text-neutral-900'
              : 'border-stone-300 bg-neutral-100 hover:border-stone-400'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-stone-400 hover:text-stone-600" />
            ) : (
              <Eye className="h-5 w-5 text-stone-400 hover:text-stone-600" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </motion.div>
  );
}