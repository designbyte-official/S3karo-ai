# Custom Backend Implementation

This application now uses a **custom backend** built with Next.js API routes and Supabase (PostgreSQL) instead of Appwrite by default. This makes it fully open-source and allows users to:

1. **Use the platform's database and S3** (paid option)
2. **Use their own S3 keys** (free option) - credentials stored locally with encryption
3. **Self-host** the entire solution

## Architecture

### Database
- **Supabase (PostgreSQL)** - Free tier available, open-source, can be self-hosted
- Alternative databases can be used (just update the connection in `lib/database/config.ts`)

### Authentication
- **JWT-based** authentication with HTTP-only cookies
- Password hashing with bcrypt
- No OTP required - simple email/password signup and signin

### File Storage
- **S3** (AWS) - Users can bring their own credentials
- Files stored in S3, metadata stored in PostgreSQL
- S3 credentials encrypted and stored locally in browser

## Setup Instructions

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the schema from `lib/database/schema.sql`
4. Get your project URL and anon key from Settings > API

### 2. Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-change-this

# Encryption Secret (for encrypting S3 keys locally)
NEXT_PUBLIC_ENCRYPTION_SECRET=your-encryption-secret

# App URL (for API calls)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema

Run the SQL schema from `lib/database/schema.sql` in your Supabase SQL Editor.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

## Features

### User Authentication
- Sign up with email and password
- Sign in with email and password
- JWT tokens stored in HTTP-only cookies
- Session management

### File Management
- Upload files to S3
- List files with filtering and sorting
- Delete files
- Rename files
- Calculate storage usage
- File sharing (coming soon)

### S3 Integration
- Users can configure their own AWS S3 credentials
- Credentials encrypted and stored locally
- All S3 operations happen client-side
- File metadata stored in PostgreSQL

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user

### Files
- `GET /api/files` - List files (with filters)
- `POST /api/files` - Create file metadata
- `GET /api/files/space` - Get storage usage
- `DELETE /api/files/[id]` - Delete file
- `PATCH /api/files/[id]` - Update file (rename, share)

## Migration from Appwrite

The application now uses the custom backend by default. Appwrite code is kept for backward compatibility but is not used.

### For Existing Users
- Need to sign up again with the new system
- Files in Appwrite will need to be migrated manually (if needed)

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- HTTP-only cookies for session management
- S3 credentials encrypted with AES before storing locally
- All API routes protected with authentication

## Open Source

This solution is fully open-source:
- No vendor lock-in
- Can be self-hosted
- Uses free/open-source technologies
- Users control their own data

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Other Platforms
- Any platform that supports Next.js
- Ensure environment variables are set
- Database connection (Supabase) works from server

## Database Alternatives

You can replace Supabase with:
- **PostgreSQL** (self-hosted)
- **MySQL** (with schema changes)
- **SQLite** (for small deployments)
- **MongoDB** (with schema changes)
- Any database with a JavaScript client

Just update `lib/database/config.ts` with your database client.

## Support

For issues or questions:
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

