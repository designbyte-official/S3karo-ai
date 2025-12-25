# Local Setup Documentation

**⚠️ This folder is excluded from git. Add your local configuration here.**

## Database Setup

### Option 1: Neon Database (Recommended - Free PostgreSQL)

**Platform:** [Neon](https://neon.tech) - Serverless PostgreSQL with free tier

**Steps:**
1. Go to https://neon.tech and sign up (free tier available)
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://user:password@host/dbname?sslmode=require`)
4. Add to `.env.local`:
   ```env
   DATABASE_URL=your_neon_connection_string_here
   ```

**Free Tier Limits:**
- 0.5 GB storage
- Unlimited projects
- Perfect for development and small projects

**Connection String Format:**
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

### Option 2: MongoDB Atlas (Alternative - Free Tier)

**Platform:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Free MongoDB cluster

**Steps:**
1. Go to https://www.mongodb.com/cloud/atlas and sign up
2. Create a free cluster (M0 - Free tier)
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string
6. Add to `.env.local`:
   ```env
   MONGODB_URI=your_mongodb_connection_string_here
   ```

**Free Tier Limits:**
- 512 MB storage
- Shared cluster
- Great for NoSQL needs

### Option 3: Railway (PostgreSQL - Free Tier)

**Platform:** [Railway](https://railway.app) - PostgreSQL with free tier

**Steps:**
1. Go to https://railway.app and sign up
2. Create new project → Add PostgreSQL
3. Copy connection string
4. Add to `.env.local`:
   ```env
   DATABASE_URL=your_railway_connection_string_here
   ```

**Free Tier:**
- $5 credit monthly
- Enough for small projects

## Database Schema

Run the SQL schema from `lib/database/schema.sql` in your database:

### For Neon:
1. Go to Neon Console → SQL Editor
2. Paste the schema SQL
3. Run it

### For MongoDB:
The schema will be created automatically when you insert documents.

## Environment Variables

Create `.env.local` file in root directory:

```env
# Database (Choose one)
# For Neon/PostgreSQL:
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# OR for MongoDB:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-random-secret-key-here

# Encryption Secret (for encrypting S3 keys locally)
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## AWS S3 Setup

### 1. Create S3 Bucket
1. Go to AWS S3 Console
2. Create bucket
3. Note the bucket name and region

### 2. Configure CORS
1. Go to bucket → Permissions → CORS
2. Use the CORS config from the S3 Setup Guide in the app
3. Replace `YOUR_ORIGIN` with your app URL

### 3. Create IAM User
1. Go to AWS IAM Console
2. Create user
3. Attach policy (use the IAM policy from setup guide)
4. Create Access Key
5. Save Access Key ID and Secret Access Key

### 4. Configure in App
1. Click "Settings" in header
2. Enter AWS credentials
3. Click "View Setup Guide" for detailed instructions

## Running the Application

```bash
# Install dependencies
pnpm install

# Run database migrations (if needed)
# For Neon: Run schema.sql in SQL Editor
# For MongoDB: Schema auto-creates

# Start development server
pnpm run dev
```

## Troubleshooting

### Database Connection Issues
- Check connection string format
- Ensure database is accessible from your IP
- For Neon: Check if project is paused (free tier auto-pauses)

### S3 Upload Issues
- Verify CORS configuration
- Check IAM permissions
- Ensure bucket name is correct
- Check region matches

### Authentication Issues
- Clear browser cookies
- Check JWT_SECRET is set
- Verify database has users table

## Production Deployment

### Vercel
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Database for Production
- Neon: Upgrade to paid tier if needed
- MongoDB Atlas: Free tier works for small apps
- Railway: Use paid tier for production

## Support

For issues:
1. Check database connection
2. Verify environment variables
3. Check browser console for errors
4. Review server logs

