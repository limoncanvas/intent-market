/**
 * Standardized API response utilities
 */

import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  res.status(statusCode).json({ data });
}

export function sendError(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ error: message });
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  total?: number,
  limit?: number,
  offset?: number
): void {
  res.json({
    data: items,
    pagination: {
      total: total || items.length,
      limit: limit || items.length,
      offset: offset || 0,
    },
  });
}
