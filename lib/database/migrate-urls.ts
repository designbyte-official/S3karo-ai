/**
 * Migration script to update all file URLs to use CDN URL
 * Run this once to update existing database records
 * 
 * Usage: npx tsx lib/database/migrate-urls.ts
 */

import { isDatabaseConfigured } from './db';
import { migrateFileUrlsToCdn } from './queries';

async function main() {
  console.log('Starting file URL migration to CDN...');
  
  if (!isDatabaseConfigured()) {
    console.error('Database not configured. Please set up your database connection.');
    process.exit(1);
  }

  try {
    const result = await migrateFileUrlsToCdn();
    console.log(`✅ Migration complete!`);
    console.log(`   Updated: ${result.updated} files`);
    console.log(`   Errors: ${result.errors} files`);
    
    if (result.errors > 0) {
      console.warn('⚠️  Some files failed to update. Check the logs above.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

