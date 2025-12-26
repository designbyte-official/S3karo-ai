/**
 * Production environment checks and utilities
 * Use this to ensure the application is properly configured for production
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if required environment variables are set
 * Throws an error in production if critical variables are missing
 */
export function validateProductionEnv(): void {
  if (!isProduction()) {
    return; // Skip validation in development
  }

  const requiredVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for production: ${missingVars.join(", ")}`
    );
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig() {
  return {
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    enableLogging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === "true",
  };
}

