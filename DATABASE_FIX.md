# Database Schema Fix

## Issue
The database table `subscriptions` is missing the following columns:
- `storage_limit`
- `storage_used`
- `bandwidth_limit`
- `bandwidth_used`

## Solution

### Option 1: Run the fix script (Recommended)
```bash
pnpm db:fix-columns
```

### Option 2: Run migrations
```bash
pnpm db:push
```

### Option 3: Manual SQL
Run this SQL in your database:
```sql
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 1073741824,
  ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bandwidth_limit BIGINT DEFAULT 10737418240,
  ADD COLUMN IF NOT EXISTS bandwidth_used BIGINT DEFAULT 0;

UPDATE subscriptions 
  SET storage_limit = 1073741824 WHERE storage_limit IS NULL,
      storage_used = 0 WHERE storage_used IS NULL,
      bandwidth_limit = 10737418240 WHERE bandwidth_limit IS NULL,
      bandwidth_used = 0 WHERE bandwidth_used IS NULL;
```

## After Fix
The error `column "storage_limit" does not exist` should be resolved.

