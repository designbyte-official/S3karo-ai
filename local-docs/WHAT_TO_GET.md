# What You Need to Get - Complete Checklist

## ✅ Required Items (Must Have)

### 1. **Database - Neon (PostgreSQL)**
**Where to get:** https://neon.tech

**Steps:**
1. Go to https://neon.tech
2. Click "Sign Up" (free, no credit card)
3. Create a new project
4. Copy your connection string (looks like: `postgresql://user:password@host/dbname?sslmode=require`)

**What you'll get:**
- `DATABASE_URL` - Connection string

**Free tier includes:**
- 0.5 GB storage
- Unlimited projects
- Perfect for development

---

### 2. **JWT Secret Key**
**Where to get:** Generate yourself

**How to generate:**
```bash
# Option 1: Using OpenSSL (Mac/Linux)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Go to: https://randomkeygen.com/
# Use "CodeIgniter Encryption Keys"
```

**What you'll get:**
- `JWT_SECRET` - Random string (e.g., `xK9mP2qL8vN4wR6tY1zA3bC5dE7fG9hI0jK`)

**Example:**
```
JWT_SECRET=xK9mP2qL8vN4wR6tY1zA3bC5dE7fG9hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA
```

---

### 3. **Encryption Secret**
**Where to get:** Generate yourself

**How to generate:**
```bash
# Same as JWT_SECRET - use a different random string
openssl rand -base64 32
```

**What you'll get:**
- `NEXT_PUBLIC_ENCRYPTION_SECRET` - Random string

**Example:**
```
NEXT_PUBLIC_ENCRYPTION_SECRET=aB3cD5eF7gH9iJ1kL2mN4oP6qR8sT0uV2wX4yZ6
```

---

## 🔵 Optional Items (For S3 File Storage)

### 4. **AWS S3 Credentials** (If using S3 storage)
**Where to get:** https://aws.amazon.com

**Steps:**
1. Go to https://aws.amazon.com
2. Sign up for AWS account (free tier available)
3. Go to **IAM Console** → **Users** → **Create User**
4. Attach policy (use the IAM policy from Setup Guide)
5. Create **Access Key** → Save:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

**What you'll need:**
- AWS Account (free tier: 5GB S3 storage for 12 months)
- Access Key ID
- Secret Access Key
- Region (e.g., `us-east-1`)
- S3 Bucket Name

**How to create S3 bucket:**
1. Go to **S3 Console**
2. Click "Create bucket"
3. Choose name (must be unique globally)
4. Choose region
5. Save bucket name

**Free tier:**
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- First 12 months free

---

## 📋 Complete Environment Variables List

Create `.env.local` file in project root:

```env
# ============================================
# REQUIRED - Database
# ============================================
# Get from: https://neon.tech
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ============================================
# REQUIRED - Security
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=your-random-secret-key-here

# Generate with: openssl rand -base64 32
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here

# ============================================
# REQUIRED - App URL
# ============================================
# For local: http://localhost:3000
# For production: https://yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# OPTIONAL - AWS S3 (if using S3 storage)
# ============================================
# These are NOT needed in .env.local
# Users enter them in the app UI (stored locally encrypted)
# AWS_ACCESS_KEY_ID=not-needed-here
# AWS_SECRET_ACCESS_KEY=not-needed-here
```

---

## 🚀 Quick Setup Steps

### Step 1: Get Database
1. ✅ Go to https://neon.tech
2. ✅ Sign up (free)
3. ✅ Create project
4. ✅ Copy connection string

### Step 2: Generate Secrets
```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Encryption Secret
openssl rand -base64 32
```

### Step 3: Create .env.local
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local and add your values
```

### Step 4: Setup Database
```bash
# Push schema to database
npm run db:push
```

### Step 5: Run App
```bash
npm run dev
```

---

## 📍 Where to Get Each Item - Summary

| Item | Where | Cost | Required? |
|------|-------|------|-----------|
| **Database (Neon)** | https://neon.tech | Free | ✅ Yes |
| **JWT Secret** | Generate yourself | Free | ✅ Yes |
| **Encryption Secret** | Generate yourself | Free | ✅ Yes |
| **AWS S3** | https://aws.amazon.com | Free tier | ❌ Optional |
| **App URL** | Your domain/localhost | Free | ✅ Yes |

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **JWT_SECRET** - Keep it secret, use different one for production
3. **Encryption Secret** - Use different one for each environment
4. **AWS Keys** - Users enter in app UI (encrypted locally), not in .env

---

## ✅ Checklist

Before starting, make sure you have:

- [ ] Neon database account (https://neon.tech)
- [ ] Database connection string
- [ ] JWT secret (generated)
- [ ] Encryption secret (generated)
- [ ] `.env.local` file created
- [ ] All values added to `.env.local`
- [ ] AWS account (optional, for S3)
- [ ] AWS S3 bucket created (optional)
- [ ] AWS IAM user with access keys (optional)

---

## 🆘 Need Help?

1. **Database Issues:** Check `local-docs/DATABASE_PLATFORMS.md`
2. **Setup Issues:** Check `local-docs/QUICK_START.md`
3. **S3 Setup:** Use the Setup Guide in the app UI
4. **Migration Issues:** Check `local-docs/DRIZZLE_SETUP.md`

---

## 💡 Pro Tips

1. **Use different secrets for development and production**
2. **Neon auto-pauses on free tier** - Just resume when needed
3. **AWS free tier** - Great for testing, but watch usage
4. **Keep secrets safe** - Never share or commit them
5. **Test locally first** - Before deploying to production

