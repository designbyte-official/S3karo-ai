import { NextRequest } from 'next/server';
import { isDatabaseConfigured } from '@/lib/database/db';
import { createSuccessResponse } from '@/lib/utils/api-response';

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 * Returns service status and dependencies
 */
export async function GET(request: NextRequest) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: isDatabaseConfigured() ? 'connected' : 'not_configured',
      // Add more health checks as needed
    },
  };

  // Determine overall health status
  const isHealthy = checks.checks.database === 'connected' || process.env.NODE_ENV === 'development';

  return createSuccessResponse(
    {
      ...checks,
      status: isHealthy ? 'healthy' : 'degraded',
    },
    isHealthy ? 200 : 503
  );
}

