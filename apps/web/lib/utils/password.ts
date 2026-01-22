// Password strength utilities

export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 100,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    feedback.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  } else if (password.length >= PASSWORD_REQUIREMENTS.minLength) {
    score += 1
  }

  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else if (PASSWORD_REQUIREMENTS.requireUppercase) {
    score += 1
  }

  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else if (PASSWORD_REQUIREMENTS.requireLowercase) {
    score += 1
  }

  // Numbers check
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else if (PASSWORD_REQUIREMENTS.requireNumbers) {
    score += 1
  }

  // Special characters (optional)
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  }

  // Max length check
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    feedback.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }

  const isValid = feedback.length === 0 && score >= 3

  return {
    score,
    feedback,
    isValid,
  }
}

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Very Weak'
    case 2:
      return 'Weak'
    case 3:
      return 'Good'
    case 4:
      return 'Strong'
    default:
      return 'Very Weak'
  }
}

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-red-500'
    case 2:
      return 'text-orange-500'
    case 3:
      return 'text-yellow-500'
    case 4:
      return 'text-green-500'
    default:
      return 'text-red-500'
  }
}

export const generatePasswordSuggestion = (password: string): string => {
  const strength = validatePasswordStrength(password)

  if (strength.isValid) {
    return 'Password is strong!'
  }

  const suggestions: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    suggestions.push(`Add ${PASSWORD_REQUIREMENTS.minLength - password.length} more characters`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    suggestions.push('Add an uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    suggestions.push('Add a lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    suggestions.push('Add a number')
  }

  return suggestions.length > 0 ? `Suggestion: ${suggestions.join(', ')}` : 'Password meets basic requirements'
}