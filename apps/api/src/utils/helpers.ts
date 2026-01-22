/**
 * General utility helpers for common operations
 */

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString()
}

export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const sanitizeString = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '')
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}