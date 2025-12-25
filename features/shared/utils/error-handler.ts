// Centralized error handling

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred",
      statusCode: 500,
    };
  }

  return {
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}

export function logError(error: unknown, context?: string) {
  const errorInfo = handleError(error);
  console.error(`[${context || "Error"}]`, {
    message: errorInfo.message,
    statusCode: errorInfo.statusCode,
    code: errorInfo.code,
    timestamp: new Date().toISOString(),
  });
}

