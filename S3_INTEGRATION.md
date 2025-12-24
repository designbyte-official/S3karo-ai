# S3 Storage Integration

This document describes the S3 storage integration that allows users to use AWS S3 instead of Appwrite for file storage.

## Features

- **Dual Storage Mode**: Toggle between Appwrite and S3 storage modes
- **AWS S3 Integration**: Full support for uploading, downloading, listing, and deleting files from S3
- **Client-Side Configuration**: AWS credentials are stored locally in the browser (never sent to servers)
- **Same UI**: All existing UI components work seamlessly with both storage modes
- **Pagination Support**: S3 file listing with pagination support
- **File Operations**: Upload, download, rename, and delete work in both modes

## Setup

### For Users (S3 Mode)

1. Click on the "Settings" button next to the storage mode toggle in the header
2. Enter your AWS credentials:
   - **AWS Access Key ID**: Your AWS access key
   - **AWS Secret Access Key**: Your AWS secret key
   - **AWS Region**: Your S3 bucket region (e.g., `us-east-1`)
   - **S3 Bucket Name**: Your S3 bucket name
3. Click "Save Configuration"
4. Toggle to "S3" mode

### AWS IAM Permissions Required

Your AWS IAM user/role needs the following S3 permissions:

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

## Architecture

### Storage Mode Toggle
- Location: `components/StorageModeToggle.tsx`
- Functionality: Allows users to switch between Appwrite and S3 modes
- Storage: Mode preference stored in `localStorage`

### S3 Configuration
- Location: `lib/s3/config.ts`
- Functionality: Manages S3 credentials and configuration
- Security: All credentials stored in browser `localStorage` (client-side only)

### S3 Client
- Location: `lib/s3/client.ts`
- Functionality: Creates AWS S3 client instances

### S3 Operations
- Location: `lib/s3/index.ts`
- Functions:
  - `uploadFileToS3`: Upload files to S3
  - `listS3Files`: List files with filtering and pagination
  - `deleteFileFromS3`: Delete files from S3
  - `renameFileInS3`: Rename files (copy + delete)
  - `getS3TotalSpaceUsed`: Calculate storage usage
  - `getS3DownloadUrl`: Generate signed download URLs
  - `getS3ViewUrl`: Generate signed view URLs

### Unified File Actions
- Location: `lib/actions/file.actions.client.ts`
- Functionality: Client-side actions that route to either Appwrite or S3 based on storage mode

## File Structure

Files are stored in S3 with the following structure:
```
{ownerId}/{timestamp}-{filename}
```

Metadata is stored in S3 object metadata:
- `owner`: File owner ID
- `accountId`: Account ID
- `type`: File type (document, image, video, audio, other)
- `extension`: File extension
- `originalName`: Original filename

## Limitations

1. **File Sharing**: The share functionality (sharing files with other users) is only available in Appwrite mode. S3 mode doesn't support this feature yet.

2. **User Management**: User authentication and management still uses Appwrite. Only file storage can be switched to S3.

3. **Metadata Storage**: File metadata is stored in S3 object metadata. For more complex queries, consider using a separate database.

## Security Notes

- AWS credentials are stored in browser `localStorage` and never sent to the application server
- All S3 operations use AWS SDK with proper credential management
- Signed URLs are used for file access (expire after set time)
- Users should use IAM users with minimal required permissions

## Migration

To migrate from Appwrite to S3:
1. Configure your S3 credentials
2. Switch to S3 mode
3. Files uploaded after switching will go to S3
4. Existing Appwrite files remain in Appwrite (no automatic migration)

## Open Source

This integration is designed to be open source and allows users to:
- Use their own AWS credentials
- Avoid Appwrite storage costs
- Have full control over their file storage
- Work entirely client-side for S3 operations

