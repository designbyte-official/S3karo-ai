#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 * Validates all required environment variables are set
 * Run: pnpm validate-env
 */

const requiredEnvVars = {
  production: [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_ENCRYPTION_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ],
  development: [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_ENCRYPTION_SECRET',
  ],
};

const optionalEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'AWS_REGION',
  'AWS_CDN_URL',
  'EMAIL_PROVIDER',
  'FROM_EMAIL',
  'FROM_NAME',
];

function validateEnv() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env as keyof typeof requiredEnvVars] || requiredEnvVars.development;
  
  console.log(`\n🔍 Validating environment variables for ${env}...\n`);
  
  let hasErrors = false;
  const missing: string[] = [];
  const present: string[] = [];
  const optionalPresent: string[] = [];
  
  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
      hasErrors = true;
    } else {
      present.push(varName);
    }
  }
  
  // Check optional variables
  for (const varName of optionalEnvVars) {
    if (process.env[varName]) {
      optionalPresent.push(varName);
    }
  }
  
  // Print results
  if (present.length > 0) {
    console.log('✅ Required variables present:');
    present.forEach(v => console.log(`   ✓ ${v}`));
    console.log('');
  }
  
  if (missing.length > 0) {
    console.log('❌ Missing required variables:');
    missing.forEach(v => console.log(`   ✗ ${v}`));
    console.log('');
  }
  
  if (optionalPresent.length > 0) {
    console.log('ℹ️  Optional variables set:');
    optionalPresent.forEach(v => console.log(`   • ${v}`));
    console.log('');
  }
  
  if (hasErrors) {
    console.log('💡 Tip: Copy .env.example to .env.local and fill in the values\n');
    process.exit(1);
  } else {
    console.log('✅ All required environment variables are set!\n');
    process.exit(0);
  }
}

validateEnv();

