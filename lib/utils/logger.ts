/**
 * Centralized logging utility
 * Replaces console.log/error/warn with structured logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log info messages (only in development)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
    // In production, you might want to send to monitoring service
    // if (this.isProduction && process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true') {
    //   // Send to monitoring service
    // }
  }

  /**
   * Log warnings (always logged, but can be sent to monitoring in production)
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
    // In production, send warnings to monitoring service
    if (this.isProduction) {
      // TODO: Integrate with error monitoring service
    }
  }

  /**
   * Log errors (always logged, should be sent to monitoring in production)
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      }),
    };
    console.error(this.formatMessage('error', message, errorContext));
    
    // In production, always send errors to monitoring service
    if (this.isProduction) {
      // TODO: Integrate with error monitoring service (e.g., Sentry, LogRocket)
      // Example: Sentry.captureException(error, { extra: errorContext });
    }
  }

  /**
   * Debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();

