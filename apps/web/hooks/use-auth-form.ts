'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { registerSchema, loginSchema } from '@repo/shared/validations';
import type { RegisterDTO, LoginDTO } from '@repo/shared/types';

// Form validation schemas
const clientRegisterSchema = registerSchema.shape.body;
const clientLoginSchema = loginSchema.shape.body;

// Form state types
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
}

interface UseAuthFormOptions<T> {
  initialValues: T;
  schema: z.ZodSchema<T>;
  onSubmit: (values: T) => Promise<void>;
}

// Generic form hook
function useForm<T extends Record<string, any>>({
  initialValues,
  schema,
  onSubmit,
}: UseAuthFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isValid: false,
    isDirty: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate field
  const validateField = useCallback((name: keyof T, value: unknown) => {
    try {
      // Validate single field
      if ('shape' in schema && typeof schema.shape === 'object') {
        const shape = schema.shape as Record<string, z.ZodTypeAny>;
        const fieldSchema = shape[name as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return null;
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
    }
    return null;
  }, [schema]);

  // Validate entire form
  const validateForm = useCallback((values: T) => {
    try {
      schema.parse(values);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof T;
          if (field && !errors[field]) {
            errors[field] = err.message;
          }
        });
        return { isValid: false, errors };
      }
    }
    return { isValid: false, errors: {} };
  }, [schema]);

  // Update field value
  const setFieldValue = useCallback((name: keyof T, value: unknown) => {
    setState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const fieldError = validateField(name, value);
      const newErrors = { ...prev.errors };
      
      if (fieldError) {
        newErrors[name] = fieldError;
      } else {
        delete newErrors[name];
      }

      const { isValid } = validateForm(newValues);

      return {
        values: newValues,
        errors: newErrors,
        isValid,
        isDirty: true,
      };
    });
  }, [validateField, validateForm]);

  // Set field error
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: false,
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((name: keyof T) => {
    setState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      
      const { isValid } = validateForm(prev.values);
      
      return {
        ...prev,
        errors: newErrors,
        isValid,
      };
    });
  }, [validateForm]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const { isValid, errors } = validateForm(state.values);
    
    if (!isValid) {
      setState(prev => ({ ...prev, errors, isValid: false }));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(state.values);
    } catch (error) {
      // Error handling is done in the auth context
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [state.values, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      isValid: false,
      isDirty: false,
    });
  }, [initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    isValid: state.isValid,
    isDirty: state.isDirty,
    isSubmitting,
    setFieldValue,
    setFieldError,
    clearFieldError,
    handleSubmit,
    resetForm,
  };
}

// Register form hook
export function useRegisterForm(onSubmit: (values: RegisterDTO) => Promise<void>) {
  return useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    } as RegisterDTO & { confirmPassword: string },
    schema: clientRegisterSchema.extend({
      confirmPassword: z.string().min(1, 'Please confirm your password'),
    }).refine(
      (data) => data.password === data.confirmPassword,
      {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }
    ),
    onSubmit: async (values) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = values;
      await onSubmit(registerData);
    },
  });
}

// Login form hook
export function useLoginForm(onSubmit: (values: LoginDTO) => Promise<void>) {
  return useForm({
    initialValues: {
      email: '',
      password: '',
    } as LoginDTO,
    schema: clientLoginSchema,
    onSubmit,
  });
}

// Password strength checker
export function usePasswordStrength() {
  const checkStrength = useCallback((password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    let color: string;
    
    if (score < 2) {
      strength = 'weak';
      color = 'red';
    } else if (score < 3) {
      strength = 'fair';
      color = 'orange';
    } else if (score < 4) {
      strength = 'good';
      color = 'yellow';
    } else {
      strength = 'strong';
      color = 'green';
    }

    return {
      score,
      strength,
      color,
      checks,
      percentage: (score / 5) * 100,
    };
  }, []);

  return { checkStrength };
}