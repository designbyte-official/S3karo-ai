# Drizzle ORM Setup

## Why Drizzle ORM?

✅ **Easy Database Switching** - Just change `DATABASE_URL` and `drizzle.config.ts` dialect  
✅ **Type-Safe** - Full TypeScript support  
✅ **Lightweight** - Much smaller than Prisma  
✅ **Flexible** - Works with PostgreSQL, MySQL, SQLite, and more  
✅ **No Runtime** - Zero overhead  

## Supported Databases

### PostgreSQL (Current)
- **Neon** (recommended - free tier)
- **Supabase**
- **Railway**
- **Vercel Postgres**
- **Any PostgreSQL database**

### MySQL
- **PlanetScale** (free tier)
- **Railway MySQL**
- **Any MySQL database**

### SQLite
- **Local file** (perfect for development)
- **Turso** (serverless SQLite)

## Switching Databases

### From PostgreSQL to MySQL

1. Update `drizzle.config.ts`:
```typescript
dialect: "mysql", // Change from "postgresql"
```

2. Install MySQL adapter:
```bash
npm install drizzle-orm mysql2
```

3. Update `lib/database/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = mysql.createConnection({
  uri: process.env.DATABASE_URL,
});

export const db = drizzle(connection, { schema });
```

4. Update schema types in `lib/database/schema.ts` (use `mysqlTable` instead of `pgTable`)

5. Change `DATABASE_URL` to MySQL connection string

### From PostgreSQL to SQLite

1. Update `drizzle.config.ts`:
```typescript
dialect: "sqlite",
```

2. Install SQLite adapter:
```bash
npm install drizzle-orm better-sqlite3
```

3. Update `lib/database/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("./local.db");
export const db = drizzle(sqlite, { schema });
```

## Database Migrations

### Generate Migration
```bash
pnpm run db:generate
```
This creates migration files in `./drizzle` folder.

### Push to Database
```bash
pnpm run db:push
```
This applies schema changes directly (good for development).

### Run Migrations
```bash
pnpm run db:migrate
```
This runs migration files (good for production).

### Open Drizzle Studio
```bash
pnpm run db:studio
```
Visual database browser (like Prisma Studio).

## Current Setup

We're using **Neon Database** (PostgreSQL) with Drizzle ORM.

**Connection String Format:**
```
postgresql://user:password@host/dbname?sslmode=require
```

**To switch databases:**
1. Get new `DATABASE_URL`
2. Update `drizzle.config.ts` dialect if needed
3. Install appropriate adapter if needed
4. Update `lib/database/db.ts` if needed
5. Run `npm run db:push` to sync schema

That's it! No need to change query code - Drizzle handles it all.

