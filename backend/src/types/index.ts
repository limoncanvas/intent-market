/**
 * Backend-specific types
 */

export * from '../../../shared/types';

export interface DatabaseError extends Error {
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}
