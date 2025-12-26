/**
 * Standardized API response utilities
 * Follows DRY principle - single source of truth for API responses
 */

import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: string;
  code?: string;
}

export interface ApiSuccessResponse<T = any> {
  data?: T;
  message?: string;
  [key: string]: any;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number = 500,
  options?: {
    details?: string;
    code?: string;
  }
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error,
      message,
      ...(options?.details && { details: options.details }),
      ...(options?.code && { code: options.code }),
    },
    { status: statusCode }
  );
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  message?: string,
  headers?: Record<string, string>
): NextResponse<ApiSuccessResponse<T>> {
  const responseHeaders = headers ? new Headers(headers) : undefined;
  
  return NextResponse.json(
    {
      ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data }),
      ...(message && { message }),
    },
    { 
      status: statusCode,
      ...(responseHeaders && { headers: responseHeaders }),
    }
  );
}

/**
 * Common error responses
 */
export const apiErrors = {
  unauthorized: (message: string = 'Authentication required') =>
    createErrorResponse('Unauthorized', message, 401),
  
  forbidden: (message: string = 'Access denied') =>
    createErrorResponse('Forbidden', message, 403),
  
  notFound: (message: string = 'Resource not found') =>
    createErrorResponse('Not Found', message, 404),
  
  badRequest: (message: string = 'Invalid request') =>
    createErrorResponse('Bad Request', message, 400),
  
  tooManyRequests: (message: string = 'Rate limit exceeded') =>
    createErrorResponse('Too Many Requests', message, 429),
  
  internalServerError: (message: string = 'Internal server error', details?: string) =>
    createErrorResponse('Internal Server Error', message, 500, { details }),
  
  serviceUnavailable: (message: string = 'Service unavailable') =>
    createErrorResponse('Service Unavailable', message, 503),
};

