# Changelog

All notable changes to S3-Karo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Storage and bandwidth usage tracking
- Subscription management with free tier (1GB storage, 10GB bandwidth)
- API keys management page
- Subscription dashboard page
- Storage statistics API endpoint
- File listing for public API
- Storage limit enforcement on uploads
- Automatic storage usage updates on file operations

### Changed
- Improved error handling across all API routes
- Standardized API responses
- Enhanced logging system
- Updated authentication system with better security

### Security
- Removed hardcoded default secrets
- Enforced environment variable validation
- Fixed SQL injection vulnerabilities
- Enhanced encryption for client-side credentials

## [0.1.0] - 2024-12-26

### Added
- Initial release
- Dual storage modes (Managed Storage & Private S3)
- JWT-based authentication
- Email verification
- File upload, download, delete, rename, share
- API key management
- Direct S3 uploads with presigned URLs
- Multipart uploads for large files
- Resumable uploads
- CDN support
- Storage usage tracking
- Bandwidth tracking
- Subscription management
- Public API endpoints
- Comprehensive documentation

---

## Version History

- **0.1.0** - Initial production release

