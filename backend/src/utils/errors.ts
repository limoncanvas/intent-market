/**
 * Error handling utilities
 */

import { Response } from 'express';
import { ZodError } from 'zod';
import { DatabaseError } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown, res: Response): void {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      error: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Database connection errors
  if (error instanceof Error && (error as DatabaseError).code) {
    const dbError = error as DatabaseError;
    if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
      res.status(503).json({
        error: 'Database not connected. Please check your database configuration.',
      });
      return;
    }
  }

  // App errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  // Generic errors
  res.status(500).json({
    error: error instanceof Error ? error.message : 'Internal server error',
  });
}

export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Error && (error as DatabaseError).code) {
    const dbError = error as DatabaseError;
    return dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND';
  }
  return false;
}
