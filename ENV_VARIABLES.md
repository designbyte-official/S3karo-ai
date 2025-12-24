# Environment Variables Reference

## Required Variables

### Database
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```
- **Source:** Neon DB (https://neon.tech)
- **Required:** Yes

### Authentication
```env
JWT_SECRET=your-jwt-secret-here
```
- **Generate:** `openssl rand -base64 32`
- **Required:** Yes
- **Purpose:** Signing JWT tokens for authentication

### Encryption
```env
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here
```
- **Generate:** `openssl rand -base64 32`
- **Required:** Yes
- **Purpose:** Encrypting S3 credentials in browser

### App URL
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- **Required:** Yes
- **Purpose:** Base URL for API calls

---

## Optional Variables

### Platform S3 (For Subscribed Users)

**Only add these if you want to offer Platform S3 to subscribed users.**

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=platform-storage-bucket
```

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key for platform S3 | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | Yes |
| `AWS_S3_BUCKET` | Platform S3 bucket name | Yes |
| `AWS_REGION` | AWS region (defaults to `us-east-1`) | No |

**Note:** 
- These are for **Platform S3** (paid feature)
- Users with **Own S3** enter credentials in UI (no env vars needed)
- See `local-docs/PLATFORM_S3_SETUP.md` for setup

---

### Email Configuration (Optional)

```env
EMAIL_PROVIDER=ethereal
FROM_EMAIL=noreply@example.com
FROM_NAME=Storage App
```

**For Ethereal (Free Testing):**
- No additional variables needed
- Automatically creates test account

**For Brevo (300 emails/day free):**
```env
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your-brevo-api-key
FROM_EMAIL=your-verified-email@domain.com
FROM_NAME=Storage App
```

**For Mailgun (100 emails/day free):**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
FROM_EMAIL=noreply@your-mailgun-domain.com
FROM_NAME=Storage App
```

---

## Complete .env.local Example

```env
# ===== REQUIRED =====
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-jwt-secret-here
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== OPTIONAL: Platform S3 =====
# AWS_ACCESS_KEY_ID=your-aws-access-key-id
# AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=platform-storage-bucket

# ===== OPTIONAL: Email =====
# EMAIL_PROVIDER=ethereal
# FROM_EMAIL=noreply@example.com
# FROM_NAME=Storage App
```

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git
- Use different values for development and production
- Rotate secrets regularly
- Keep AWS credentials secure (use IAM with minimal permissions)

---

## Quick Reference

| Feature | Env Vars Needed | User Action |
|---------|----------------|-------------|
| **Own S3** | None | Enter credentials in UI |
| **Platform S3** | 4 AWS vars | Requires subscription |
| **Email** | Provider-specific | Configure in `.env.local` |

