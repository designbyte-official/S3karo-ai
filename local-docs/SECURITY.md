# 🔒 Security Guide

## How Credentials Are Stored

### Own S3 Credentials (User-Provided)

**Storage Location:** Browser storage (localStorage or sessionStorage)

**Encryption:**
- ✅ **PBKDF2 key derivation** (10,000 iterations) - Makes brute force attacks slow
- ✅ **AES-256-CBC encryption** - Industry standard encryption
- ✅ **Random salt per encryption** - Prevents rainbow table attacks
- ✅ **Random IV per encryption** - Same credentials = different ciphertext
- ✅ **User-specific key derivation** - Even if secret is exposed, user data is protected

**Format:** `salt:iv:encryptedData` (all base64 encoded)

**Example:**
```
Before: {"accessKeyId":"AKIA...","secretAccessKey":"abc123..."}
After:  "a1b2c3d4...:e5f6g7h8...:i9j0k1l2m3n4o5p6..."
```

### Platform S3 Credentials (Server-Side)

**Storage Location:** Server environment variables (`.env.local`)

**Security:**
- ✅ Never exposed to client
- ✅ Only accessible server-side
- ✅ Should use IAM with minimal permissions
- ✅ Rotate regularly

---

## Security Best Practices

### 1. Environment Variables

**✅ DO:**
- Store secrets in `.env.local` (never commit to git)
- Use different secrets for development and production
- Generate strong secrets: `openssl rand -base64 32`
- Rotate secrets regularly (every 90 days)
- Use `.gitignore` to exclude `.env.local`

**❌ DON'T:**
- Commit `.env.local` to git
- Share secrets in chat/email
- Use default/weak secrets
- Reuse secrets across projects

### 2. Encryption Secret

**Important:** `NEXT_PUBLIC_ENCRYPTION_SECRET` is exposed to the browser!

**Why?** We need it client-side to encrypt/decrypt user credentials.

**Protection:**
- ✅ Use a strong, unique secret (32+ characters)
- ✅ Implement Content Security Policy (CSP)
- ✅ Sanitize all user inputs (prevent XSS)
- ✅ Use HTTPS only
- ✅ User-specific key derivation adds extra layer

**Generate:**
```bash
openssl rand -base64 32
```

### 3. Browser Storage Security

**Risks:**
- ⚠️ XSS attacks can read localStorage
- ⚠️ Browser extensions with storage permissions
- ⚠️ Physical access to device
- ⚠️ Malicious scripts on compromised sites

**Protection:**
- ✅ **Content Security Policy (CSP)** - Prevents XSS
- ✅ **Input sanitization** - Clean all user inputs
- ✅ **HTTPS only** - Encrypts data in transit
- ✅ **Encryption** - Even if accessed, data is encrypted
- ✅ **Session storage option** - Cleared on tab close (more secure)

### 4. XSS Protection

**Implement CSP Headers:**

Add to `next.config.ts`:
```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.amazonaws.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

### 5. AWS IAM Permissions

**Principle of Least Privilege:**

Only grant minimum required permissions:

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
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

**✅ DO:**
- Create separate IAM user for each environment
- Use bucket-specific policies
- Rotate access keys regularly
- Enable MFA for AWS account
- Monitor CloudTrail for suspicious activity

**❌ DON'T:**
- Use root AWS credentials
- Grant `s3:*` permissions
- Share credentials between users
- Store credentials in code

### 6. Database Security

**Connection String:**
- ✅ Use SSL/TLS (`sslmode=require`)
- ✅ Store in `.env.local` (never commit)
- ✅ Use connection pooling
- ✅ Rotate passwords regularly

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
```

### 7. JWT Security

**Secret:**
- ✅ Generate strong secret: `openssl rand -base64 32`
- ✅ Use different secret for dev/prod
- ✅ Rotate regularly
- ✅ Store in `.env.local`

**Token:**
- ✅ HTTP-only cookies (prevents XSS)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite attribute
- ✅ Short expiration time

---

## Security Checklist

### Development
- [ ] `.env.local` in `.gitignore`
- [ ] Strong secrets generated
- [ ] HTTPS enabled (or localhost)
- [ ] CSP headers configured
- [ ] Input sanitization implemented

### Production
- [ ] All secrets rotated from dev
- [ ] HTTPS enforced
- [ ] CSP headers active
- [ ] Database SSL enabled
- [ ] AWS IAM with minimal permissions
- [ ] Monitoring/logging enabled
- [ ] Regular security audits
- [ ] Backup and recovery plan

---

## Threat Model

### What We Protect Against

✅ **Encryption at rest** - Credentials encrypted in browser storage
✅ **Encryption in transit** - HTTPS for all communications
✅ **User isolation** - User-specific key derivation
✅ **Brute force resistance** - PBKDF2 with 10,000 iterations
✅ **Rainbow table resistance** - Random salt per encryption

### What We Can't Protect Against

⚠️ **XSS attacks** - If your site is compromised, attacker can read localStorage
   - **Mitigation:** CSP headers, input sanitization

⚠️ **Physical access** - If someone has your device, they can access browser storage
   - **Mitigation:** Device encryption, session storage (cleared on close)

⚠️ **Browser extensions** - Extensions with storage permissions can read data
   - **Mitigation:** Use trusted extensions only

⚠️ **Server compromise** - If server is hacked, env vars can be stolen
   - **Mitigation:** Rotate credentials, use secrets manager (AWS Secrets Manager)

---

## Incident Response

### If Credentials Are Compromised

1. **Immediately rotate:**
   - AWS access keys
   - Encryption secret
   - JWT secret
   - Database password

2. **Revoke access:**
   - Delete compromised IAM user
   - Invalidate all JWT tokens
   - Force user password resets

3. **Investigate:**
   - Check CloudTrail logs
   - Review access logs
   - Identify attack vector

4. **Notify users:**
   - Inform affected users
   - Recommend credential rotation
   - Provide security guidance

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## Questions?

If you have security concerns or questions:
1. Review this document
2. Check OWASP guidelines
3. Consult security experts
4. Report vulnerabilities responsibly

