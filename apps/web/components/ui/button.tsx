'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'white' | 'black';
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      loading = false,
      loadingText = 'Loading...',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      'relative font-saira px-4 py-2.5 overflow-hidden rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

    const variantClasses = {
      primary:
        'bg-gradient-to-t from-green-400 to-green-500 border border-black/5 text-white',
      secondary: 'bg-green-500 hover:bg-green-600 border border-black/5 text-white',
      white: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
      black: 'bg-gradient-to-t from-gray-800 to-black border border-black/5 text-white hover:from-gray-700 hover:to-gray-900',
    };

    const buttonStyle =
      variant === 'primary'
        ? {
            boxShadow:
              'inset 0px 3px 6px rgba(255,255,255,0.5), 0px 2px 6px rgba(0,0,0,0.1)',
          }
        : variant === 'black'
          ? {
              boxShadow:
                'inset 0px 3px 6px rgba(255,255,255,0.1), 0px 2px 6px rgba(0,0,0,0.2)',
            }
          : variant === 'white'
            ? { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }
            : {};

    return (
      <button
        ref={ref}
        onClick={props.onClick}
        disabled={isDisabled}
        style={buttonStyle}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

