/**
 * Error Message Utilities
 * 
 * Provides user-friendly error messages from API errors
 */

import { ClientApiError } from '../api/client';
import { HTTP_STATUS } from '@repo/shared/constants';

/**
 * Get user-friendly error message from an error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return getUserFriendlyMessage(error.status, error.message);
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    return error.message || 'An unexpected error occurred.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get user-friendly message based on HTTP status code
 */
function getUserFriendlyMessage(status: number, defaultMessage: string): string {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return 'Invalid request. Please check your input.';
    
    case HTTP_STATUS.UNAUTHORIZED:
      return 'Your session has expired. Please log in again.';
    
    case HTTP_STATUS.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    
    case HTTP_STATUS.NOT_FOUND:
      return 'The requested resource was not found.';
    
    case HTTP_STATUS.CONFLICT:
      return 'This action conflicts with existing data.';
    
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return 'The provided data is invalid. Please check your input.';
    
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return 'Too many requests. Please wait a moment and try again.';
    
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return 'Server error. Please try again later.';
    
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable. Please try again later.';
    
    case HTTP_STATUS.GATEWAY_TIMEOUT:
      return 'Request timed out. Please try again.';
    
    default:
      return defaultMessage || 'An error occurred. Please try again.';
  }
}

/**
 * Check if error is a network error (offline)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    );
  }
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ClientApiError) {
    // Retry on 5xx server errors, not on 4xx client errors
    return error.status >= 500;
  }
  
  // Retry on network errors
  return isNetworkError(error);
}
