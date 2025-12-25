# Quick Start Guide

## 1. Get Free Database (Neon)

1. Go to **https://neon.tech**
2. Sign up (free, no credit card needed)
3. Create a new project
4. Copy your connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

## 2. Setup Environment

Create `.env.local` file:

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-random-secret-key-here

# Encryption Secret (for S3 keys)
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Install & Setup

```bash
# Install dependencies
pnpm install

# Create database tables
pnpm run db:generate

# OR use migration endpoint (after starting server)
# POST http://localhost:3000/api/migrate
```

## 4. Run Application

```bash
pnpm run dev
```

Visit: http://localhost:3000

## 5. Sign Up

1. Click "Sign Up"
2. Enter email, password, and full name
3. You're in!

## 6. Configure S3 (Optional - for file storage)

1. Click "Settings" in header
2. Enter AWS credentials:
   - Access Key ID
   - Secret Access Key
   - Region (e.g., `us-east-1`)
   - Bucket Name
3. Click "View Setup Guide" for CORS & IAM setup
4. Toggle to "S3" mode

## That's It! 🎉

You now have:
- ✅ Custom backend (no Appwrite needed)
- ✅ Free PostgreSQL database (Neon)
- ✅ User authentication
- ✅ File storage (S3 or local)
- ✅ Open source & self-hostable

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` is correct
- Ensure Neon project is not paused
- Verify connection string format

### Migration Errors
- Run `npm run db:push` again
- Or use `/api/migrate` endpoint
- Check database logs in Neon console

### S3 Upload Issues
- Verify CORS is configured (use Setup Guide)
- Check IAM permissions
- Ensure bucket name is correct

## Next Steps

- Read `local-docs/SETUP.md` for detailed setup
- Check `local-docs/DRIZZLE_SETUP.md` for database switching
- See `local-docs/DATABASE_PLATFORMS.md` for other database options

