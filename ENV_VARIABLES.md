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

### Encryption (AES-256-GCM)
```env
NEXT_PUBLIC_AES_KEY=your-32-byte-base64-encoded-key
NEXT_PUBLIC_AES_IV=your-12-byte-base64-encoded-iv
```
- **Generate AES Key (32 bytes = 256 bits):**
  ```bash
  # Using Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  
  # Or using OpenSSL
  openssl rand -base64 32
  ```

- **Generate AES IV (12 bytes for AES-GCM):**
  ```bash
  # Using Node.js
  node -e "console.log(require('crypto').randomBytes(12).toString('base64'))"
  
  # Or using OpenSSL
  openssl rand -base64 12
  ```

- **Quick Generation (Both at once):**
  ```bash
  echo "NEXT_PUBLIC_AES_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  echo "NEXT_PUBLIC_AES_IV=$(node -e "console.log(require('crypto').randomBytes(12).toString('base64'))")"
  ```

- **Required:** Yes (AES_KEY), Optional (AES_IV - will generate from key if not provided)
- **Purpose:** Encrypting S3 credentials in browser using AES-256-GCM
- **Note:** 
  - Uses Web Crypto API with Buffer - no external dependencies
  - Falls back to `NEXT_PUBLIC_ENCRYPTION_SECRET` if `NEXT_PUBLIC_AES_KEY` is not set (for backward compatibility)
  - IV will be auto-generated from key if not provided

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
NEXT_PUBLIC_AES_KEY=your-32-byte-base64-encoded-key
NEXT_PUBLIC_AES_IV=your-12-byte-base64-encoded-iv
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

### 🔒 Credential Storage Security

**Own S3 Credentials (User-Provided):**
- ✅ Encrypted with **AES-256-GCM** before storing in browser
- ✅ Uses Web Crypto API (SubtleCrypto) - native browser API
- ✅ Fixed key and IV from environment variables (consistent encryption)
- ✅ Stored in browser localStorage (encrypted)
- ✅ No external dependencies (uses Buffer and native crypto)

**Platform S3 Credentials (Server-Side):**
- ✅ Stored in server environment variables (never exposed to client)
- ✅ Only accessible server-side
- ✅ Use IAM with minimal permissions

**Protection Against:**
- ✅ XSS attacks (CSP headers configured)
- ✅ Brute force (AES-256 with 256-bit key)
- ✅ Data tampering (AES-GCM provides authentication)
- ✅ Replay attacks (fixed IV ensures consistent encryption)

**See:** `local-docs/SECURITY.md` for detailed security guide

---

---

## Quick Reference

| Feature | Env Vars Needed | User Action |
|---------|----------------|-------------|
| **Own S3** | None | Enter credentials in UI |
| **Platform S3** | 4 AWS vars | Requires subscription |
| **Email** | Provider-specific | Configure in `.env.local` |

