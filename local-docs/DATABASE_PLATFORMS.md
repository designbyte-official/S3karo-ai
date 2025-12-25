# Free Database Platform Options

## Recommended: Neon Database

**Platform:** [Neon.tech](https://neon.tech)

**Type:** PostgreSQL (Serverless)

**Free Tier:**
- 0.5 GB storage
- Unlimited projects
- Auto-pause after inactivity (resumes on connection)
- Perfect for development

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**How to Get:**
1. Sign up at https://neon.tech
2. Create project
3. Copy connection string from dashboard
4. Add to `.env.local` as `DATABASE_URL`

**Pros:**
- True PostgreSQL
- Serverless (pay per use)
- Branching support
- Free tier is generous

**Cons:**
- Auto-pauses on free tier (but resumes quickly)

---

## Alternative: MongoDB Atlas

**Platform:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

**Type:** MongoDB (NoSQL)

**Free Tier:**
- 512 MB storage
- Shared cluster
- Good for NoSQL needs

**Connection String Format:**
```
mongodb+srv://[user]:[password]@[cluster].mongodb.net/[database]
```

**How to Get:**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for dev)
5. Get connection string
6. Add to `.env.local` as `MONGODB_URI`

**Pros:**
- NoSQL flexibility
- Good free tier
- Easy setup

**Cons:**
- Need to adapt schema (NoSQL)
- Less storage than Neon

---

## Alternative: Railway

**Platform:** [Railway.app](https://railway.app)

**Type:** PostgreSQL

**Free Tier:**
- $5 credit monthly
- Enough for small projects

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**How to Get:**
1. Sign up at https://railway.app
2. Create project
3. Add PostgreSQL service
4. Copy connection string
5. Add to `.env.local` as `DATABASE_URL`

**Pros:**
- PostgreSQL
- Good free credits
- Easy deployment

**Cons:**
- Limited free credits
- Need to monitor usage

---

## Alternative: Supabase (If you prefer)

**Platform:** [Supabase](https://supabase.com)

**Type:** PostgreSQL

**Free Tier:**
- 500 MB database
- 1 GB file storage
- Good for full-stack apps

**Connection String:**
```
postgresql://postgres:[password]@[host]:5432/postgres
```

**Note:** We moved away from Supabase to Neon for better free tier, but Supabase still works if you prefer it.

---

## Recommendation

**For this project, use Neon Database:**
- Best free tier
- True PostgreSQL
- Serverless (cost-effective)
- Easy to set up
- Perfect for open-source projects

**Get your connection string:**
1. Go to https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string
5. Add to `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```

