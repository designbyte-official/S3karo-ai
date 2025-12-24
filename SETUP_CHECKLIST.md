# 🚀 Setup Checklist - Step by Step

## Before You Start

Make sure you have:
- Node.js installed (v18+)
- npm or pnpm installed
- A code editor (VS Code recommended)

---

## Step 1: Get Database (Neon) ⭐ REQUIRED

### Where: https://neon.tech

1. **Sign Up**
   - Go to https://neon.tech
   - Click "Sign Up"
   - Use GitHub/Google or email
   - **No credit card required**

2. **Create Project**
   - Click "New Project"
   - Choose name (e.g., "storage-app")
   - Select region (closest to you)
   - Click "Create Project"

3. **Get Connection String**
   - In project dashboard, find "Connection string"
   - Copy the string (looks like: `postgresql://user:pass@host/db?sslmode=require`)
   - **Save this** - you'll need it!

**✅ You now have:** `DATABASE_URL`

---

## Step 2: Generate Secrets ⭐ REQUIRED

### JWT Secret

**Generate:**
```bash
openssl rand -base64 32
```

**Or use Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**✅ You now have:** `JWT_SECRET`

---

### Encryption Secret

**Generate:**
```bash
openssl rand -base64 32
```

**✅ You now have:** `NEXT_PUBLIC_ENCRYPTION_SECRET`

---

## Step 3: Create Environment File

1. **Create `.env.local` in project root:**
   ```bash
   touch .env.local
   ```

2. **Add your values:**
   ```env
   # Database (from Neon)
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

   # Secrets (generated above)
   JWT_SECRET=your-jwt-secret-here
   NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Replace placeholders with your actual values**

**✅ File created with all values**

---

## Step 4: Install Dependencies

```bash
npm install
```

**✅ Dependencies installed**

---

## Step 5: Setup Database Schema

```bash
npm run db:push
```

**Or use migration endpoint:**
```bash
# After starting server, call:
curl -X POST http://localhost:3000/api/migrate
```

**✅ Database tables created**

---

## Step 6: Start Application

```bash
npm run dev
```

**✅ App running at http://localhost:3000**

---

## Step 7: Sign Up

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Full Name
   - Email
   - Password (min 6 characters)
4. Click "Sign Up"

**✅ Account created!**

---

## Step 8: Configure S3 (Optional) 🔵

### If you want to use S3 for file storage:

1. **Get AWS Account**
   - Go to https://aws.amazon.com
   - Sign up (free tier available)

2. **Create S3 Bucket**
   - Go to S3 Console
   - Click "Create bucket"
   - Choose unique name
   - Choose region
   - Save bucket name

3. **Create IAM User**
   - Go to IAM Console
   - Users → Create User
   - Attach policy (from Setup Guide in app)
   - Create Access Key
   - Save Access Key ID and Secret

4. **Configure in App**
   - Click "Settings" in header
   - Enter AWS credentials
   - Click "View Setup Guide" for CORS setup
   - Toggle to "S3" mode

**✅ S3 configured!**

---

## ✅ Final Checklist

Before you're done, verify:

- [ ] Neon database created
- [ ] `DATABASE_URL` in `.env.local`
- [ ] `JWT_SECRET` generated and added
- [ ] `NEXT_PUBLIC_ENCRYPTION_SECRET` generated and added
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] App running (`npm run dev`)
- [ ] Account created (signed up)
- [ ] S3 configured (optional)

---

## 🎉 You're Done!

Your app is now running with:
- ✅ Custom backend (no Appwrite needed)
- ✅ Free PostgreSQL database (Neon)
- ✅ User authentication
- ✅ File storage ready

---

## 📚 Need More Help?

- **Quick Start:** `local-docs/QUICK_START.md`
- **Detailed Setup:** `local-docs/SETUP.md`
- **Database Options:** `local-docs/DATABASE_PLATFORMS.md`
- **What to Get:** `local-docs/WHAT_TO_GET.md`

---

## 🆘 Common Issues

### Database Connection Error
- Check `DATABASE_URL` is correct
- Ensure Neon project is not paused
- Verify connection string format

### Migration Failed
- Run `npm run db:push` again
- Check database logs in Neon console
- Verify `DATABASE_URL` is correct

### App Won't Start
- Check all `.env.local` values are set
- Verify Node.js version (v18+)
- Check for port conflicts (3000)

