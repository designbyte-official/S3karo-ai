# Managed Storage Setup Guide

## Overview

**Managed Storage** (formerly Platform S3) is the platform-managed storage tier. All users can view and download files, but a **Pro subscription** is required for advanced operations (Upload, Rename, Share, and Delete).

**Own S3** is a fully unrestricted alternative - users bring their own AWS credentials (entered in the UI).

---

## Environment Variables for Managed Storage

To enable **Managed Storage** for subscribed users, add these environment variables to your `.env.local`:

```env
# Managed Storage Configuration (for subscribed users)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-platform-bucket-name
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID for your Managed Storage S3 bucket | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | Name of your Managed Storage S3 bucket | `managed-storage-bucket` |
| `AWS_REGION` | AWS region (optional, defaults to `us-east-1`) | `us-east-1` |

---

## How It Works

### Own S3 (Free)
- Users enter their **own AWS credentials** in the UI
- Credentials stored **locally in browser** (never sent to server)
- All S3 operations happen **client-side**
- No environment variables needed on server

### Managed Storage (Hybrid)
- Uses **platform's AWS credentials** from environment variables
- **Upload, Rename, Share, and Delete** are gated behind a Pro subscription
- **Read-only access** (View/Download) is available to all users
- All S3 operations happen **server-side** via API routes
- Requires environment variables above
- Requires database connection

---

## Setting Up Managed Storage

### Step 1: Create AWS S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Create a new bucket (e.g., `managed-storage-bucket`)
3. Note the bucket name and region

### Step 2: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM user (e.g., `managed-storage-user`)
3. Attach this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:HeadObject",
        "s3:CopyObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME/*",
        "arn:aws:s3:::YOUR_BUCKET_NAME"
      ]
    }
  ]
}
```

4. Create Access Key for this user
5. Copy the **Access Key ID** and **Secret Access Key**

### Step 3: Configure CORS

1. Go to your S3 bucket → **Permissions** tab
2. Find **Cross-origin resource sharing (CORS)**
3. Click **Edit** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://yourdomain.com` with your actual domain.

### Step 4: Add Environment Variables

Add to `.env.local`:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=managed-storage-bucket
```

### Step 5: Restart Server

```bash
npm run dev
```

---

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git
- Use IAM user with **minimal permissions** (only S3 access)
- Rotate credentials regularly
- Use different buckets for development and production

---

## Testing Managed Storage

1. Create a subscription for a test user in the database (set `hasPlatformAccess` to true)
2. Advanced actions (Upload, etc.) will be unlocked.
3. Switch to "Managed Storage" mode.
4. Upload a file - it should use the platform bucket

---

## Troubleshooting

### "Managed Storage requires an active subscription"
- User doesn't have an active subscription
- Check subscription status in database

### "Managed Storage configuration not found"
- Missing environment variables
- Check `.env.local` has all 4 variables
- Restart server after adding variables

### "Failed to upload to Managed Storage"
- Check AWS credentials are correct
- Verify IAM user has S3 permissions
- Check CORS configuration
- Verify bucket name is correct

---

## API Routes

Managed Storage uses these API routes:

- `POST /api/upload` - Request presigned URL for direct S3 upload
- `POST /api/upload/callback` - Save file metadata after upload
- `GET /api/files` - List files (uses platform bucket)
- `POST /api/files` - DEPRECATED: Old upload endpoint (kept for backward compatibility)
- `DELETE /api/files/[id]` - Delete file

All routes check subscription status before allowing access.
