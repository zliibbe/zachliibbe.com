import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
  stack?: string;
}

export class CustomApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CustomApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomApiError);
    }
  }
}

export const ApiErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

export function createApiError(
  message: string,
  code: ApiErrorCode,
  statusCode: number,
  details?: Record<string, unknown>
): CustomApiError {
  return new CustomApiError(message, code, statusCode, details);
}

export function logError(
  error: Error | CustomApiError,
  context?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const isCustomError = error instanceof CustomApiError;

  const logData = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      code: isCustomError ? error.code : 'UNKNOWN_ERROR',
      statusCode: isCustomError ? error.statusCode : 500,
      details: isCustomError ? error.details : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    context,
  };

  // In production, you might want to send this to a logging service
  // like Sentry, LogRocket, or DataDog
  console.error('API Error:', JSON.stringify(logData, null, 2));

  // In development, also log the full stack trace
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
}

export function handleApiError(
  error: Error | CustomApiError,
  context?: Record<string, unknown>
): NextResponse {
  logError(error, context);

  if (error instanceof CustomApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        success: false,
      },
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: ApiErrorCodes.INTERNAL_SERVER_ERROR,
      success: false,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          message: error.message,
          stack: error.stack,
        },
      }),
    },
    { status: 500 }
  );
}

export function validateRequired<T>(
  value: T,
  fieldName: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined || value === '') {
    throw createApiError(
      `${fieldName} is required`,
      ApiErrorCodes.VALIDATION_ERROR,
      400,
      { field: fieldName }
    );
  }
}

export function validateString(
  value: unknown,
  fieldName: string
): asserts value is string {
  if (typeof value !== 'string') {
    throw createApiError(
      `${fieldName} must be a string`,
      ApiErrorCodes.VALIDATION_ERROR,
      400,
      { field: fieldName, receivedType: typeof value }
    );
  }
}

export function validateArray(
  value: unknown,
  fieldName: string
): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw createApiError(
      `${fieldName} must be an array`,
      ApiErrorCodes.VALIDATION_ERROR,
      400,
      { field: fieldName, receivedType: typeof value }
    );
  }
}
