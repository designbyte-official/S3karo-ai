# Redis Setup with Upstash

S3-Karo uses **Upstash Redis** for rate limiting and caching. This is a **middleware-free** solution that works directly in API routes.

## Features

- ✅ **No Middleware Required** - Rate limiting happens directly in API routes
- ✅ **Sliding Window Algorithm** - Accurate rate limiting
- ✅ **Redis Caching** - Fast response times for frequently accessed data
- ✅ **Automatic Fallback** - Works without Redis (graceful degradation)

## Setup

### 1. Create Upstash Redis Database

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token

### 2. Add Environment Variables

Add these to your `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 3. Verify Setup

Run the validation script:

```bash
pnpm validate-env
```

You should see `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` listed as optional variables if set.

## How It Works

### Rate Limiting

Rate limiting is implemented **directly in API routes** (no middleware):

```typescript
// In app/api/v1/files/route.ts
const rateLimitCheck = await checkRateLimit(apiKeyRecord.id);
if (!rateLimitCheck.allowed) {
  return apiErrors.tooManyRequests("Rate limit exceeded");
}
```

**Features:**

- Sliding window algorithm (more accurate than fixed window)
- Per API key rate limiting
- Configurable limits per key
- Automatic reset tracking

### Caching

Frequently accessed data is cached in Redis:

```typescript
// Cache storage stats for 60 seconds
const cacheKey = `storage-stats:${user.id}`;
const cached = await getCache(cacheKey);
if (cached) return cached;

// ... fetch from database ...
await setCache(cacheKey, data, 60);
```

**Cached Endpoints:**

- `/api/storage/stats` - 60 seconds TTL
- `/api/subscriptions` - 5 minutes TTL

**Cache Invalidation:**

- Automatically invalidated when storage/subscription data changes
- Manual invalidation available via `deleteCache()`

## Architecture

```
API Route
  ↓
checkRateLimit() → Redis (Upstash)
  ↓
getCache() → Redis (Upstash)
  ↓
Database Query (if cache miss)
  ↓
setCache() → Redis (Upstash)
```

## Benefits

1. **No Middleware Overhead** - Faster request processing
2. **Accurate Rate Limiting** - Sliding window algorithm
3. **Better Performance** - Redis caching reduces database load
4. **Scalable** - Works across multiple server instances
5. **Graceful Degradation** - Works without Redis (fallback mode)

## Rate Limit Headers

All rate-limited endpoints return these headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2024-01-01T12:00:00Z
```

## Monitoring

Upstash provides built-in analytics:

- Request count
- Rate limit hits
- Cache hit/miss ratios
- Performance metrics

Access via [Upstash Console](https://console.upstash.com/)

## Troubleshooting

### Rate Limiting Not Working

1. Check environment variables are set
2. Verify Redis connection: `isRedisConfigured()` returns `true`
3. Check Upstash console for errors

### Cache Not Working

1. Verify Redis is configured
2. Check TTL values (cache expires automatically)
3. Ensure cache keys are unique per user

### Fallback Mode

If Redis is not configured, the system:

- ✅ Still works (graceful degradation)
- ✅ Rate limiting allows all requests (no limit)
- ✅ No caching (direct database queries)

This ensures the app works even without Redis configured.
