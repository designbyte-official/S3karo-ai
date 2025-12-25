# 🎯 What You Need - Simple Guide

## ⚡ Quick Answer

You need **3 things** to get started:

1. **Database** → Get from https://neon.tech (FREE)
2. **JWT Secret** → Generate yourself (FREE)
3. **Encryption Secret** → Generate yourself (FREE)

That's it! Everything else is optional.

---

## 📋 Detailed List

### 1️⃣ Database (Neon PostgreSQL) ⭐ REQUIRED

**Get from:** https://neon.tech

**What you get:**
- Connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

**Steps:**
1. Go to https://neon.tech
2. Sign up (free, no credit card)
3. Create project
4. Copy connection string

**Save as:** `DATABASE_URL` in `.env.local`

---

### 2️⃣ JWT Secret ⭐ REQUIRED

**Get from:** Generate yourself

**How:**
```bash
openssl rand -base64 32
```

**What you get:**
- Random string (e.g., `xK9mP2qL8vN4wR6tY1zA3bC5dE7fG9hI0jK`)

**Save as:** `JWT_SECRET` in `.env.local`

---

### 3️⃣ Encryption Secret ⭐ REQUIRED

**Get from:** Generate yourself

**How:**
```bash
openssl rand -base64 32
```

**What you get:**
- Random string (different from JWT_SECRET)

**Save as:** `NEXT_PUBLIC_ENCRYPTION_SECRET` in `.env.local`

---

### 4️⃣ AWS S3 (Optional) 🔵

**Two Options:**

#### Option A: Own S3 (Free for Users)
- Users enter their **own AWS credentials** in the app UI
- **No environment variables needed** on server
- Credentials stored locally in browser

#### Option B: Managed Storage (Paid Feature)
- Users use the platform's storage tier.
- **Actions gated**: Upload, Rename, Share, and Delete require a **Pro subscription**.
- **Read-only**: Free users can view and download but not modify.

**Environment Variables:**
```env
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-platform-bucket-name
```

**What you need:**
- AWS Account
- IAM user with S3 permissions
- S3 bucket for platform storage
- Access Key ID and Secret Access Key

**See:** `local-docs/PLATFORM_S3_SETUP.md` for detailed setup

---

## 📝 Your .env.local File

Create this file in project root:

```env
# From Neon (https://neon.tech)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Generated with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here

# Generated with: openssl rand -base64 32
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Managed Storage (Optional - only if offering Managed Storage to subscribers)
# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-platform-bucket-name
```

---

## 🚀 Quick Setup (5 Minutes)

```bash
# 1. Get database from https://neon.tech
# 2. Generate secrets:
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_SECRET

# 3. Create .env.local with your values

# 4. Install and setup
npm install
npm run db:push

# 5. Run app
npm run dev
```

---

## 📍 Where to Get Everything

| What | Where | Cost | Link |
|------|-------|------|------|
| Database | Neon | FREE | https://neon.tech |
| JWT Secret | Generate | FREE | `openssl rand -base64 32` |
| Encryption Secret | Generate | FREE | `openssl rand -base64 32` |
| AWS S3 | AWS | Free tier | https://aws.amazon.com |

---

## ✅ Checklist

- [ ] Neon account created
- [ ] Database connection string copied
- [ ] JWT secret generated
- [ ] Encryption secret generated
- [ ] `.env.local` file created
- [ ] All values added to `.env.local`
- [ ] Ready to run `npm run db:push`

---

## 📚 More Help

- **Detailed Setup:** See `SETUP_CHECKLIST.md`
- **What to Get:** See `local-docs/WHAT_TO_GET.md`
- **Quick Start:** See `local-docs/QUICK_START.md`

---

## 🆘 Stuck?

1. Check `SETUP_CHECKLIST.md` for step-by-step
2. Check `local-docs/WHAT_TO_GET.md` for details
3. Verify all `.env.local` values are set
4. Make sure Neon database is not paused

