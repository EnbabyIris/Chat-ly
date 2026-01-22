'use client'

import { useMemo } from 'react'
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/utils/password'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  showFeedback?: boolean
  className?: string
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showFeedback = true,
  className = '',
}) => {
  const strength = useMemo(() => validatePasswordStrength(password), [password])

  const getStrengthBars = () => {
    const bars = []
    for (let i = 0; i < 4; i++) {
      const isActive = i < strength.score
      bars.push(
        <div
          key={i}
          className={`h-2 w-full rounded-full transition-colors ${
            isActive
              ? strength.score === 4
                ? 'bg-green-500'
                : strength.score === 3
                ? 'bg-yellow-500'
                : strength.score === 2
                ? 'bg-orange-500'
                : 'bg-red-500'
              : 'bg-gray-200'
          }`}
        />
      )
    }
    return bars
  }

  if (!password) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength Bars */}
      <div className="flex gap-1">
        {getStrengthBars()}
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between text-sm">
        <span className={getPasswordStrengthColor(strength.score)}>
          {getPasswordStrengthLabel(strength.score)}
        </span>
        {strength.isValid && (
          <Check className="h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Feedback */}
      {showFeedback && strength.feedback.length > 0 && (
        <ul className="space-y-1">
          {strength.feedback.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-red-600">
              <X className="h-3 w-3" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Password Requirements Checklist
export const PasswordRequirements: React.FC<{ password: string; className?: string }> = ({
  password,
  className = '',
}) => {
  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'One number',
      met: /\d/.test(password),
    },
  ]

  return (
    <div className={`space-y-1 ${className}`}>
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          {req.met ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  )
}