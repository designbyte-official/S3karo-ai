# Email Setup Guide - Free SMTP Services

## 🎯 Recommended: Ethereal Email (FREE, No Signup!)

**Best for:** Development and testing  
**Setup:** Zero configuration - works immediately!

### How to Use:
1. **No setup needed!** Just set in `.env.local`:
   ```env
   EMAIL_PROVIDER=ethereal
   ```

2. **That's it!** Emails will be generated automatically.

3. **View emails:** Check console logs for preview URLs (emails don't actually send, perfect for testing)

**✅ Pros:**
- No signup required
- No configuration needed
- Perfect for development
- Free forever

**❌ Cons:**
- Emails don't actually send (testing only)
- Need real SMTP for production

---

## 🔵 Option 2: Brevo (Sendinblue) - FREE

**Best for:** Production  
**Free tier:** 300 emails/day

### Setup Steps:

1. **Sign up:** https://www.brevo.com
2. **Go to:** Settings → SMTP & API
3. **Get SMTP credentials:**
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Username: Your SMTP login
   - Password: Your SMTP key

4. **Add to `.env.local`:**
   ```env
   EMAIL_PROVIDER=brevo
   BREVO_SMTP_USER=your_smtp_login
   BREVO_SMTP_PASSWORD=your_smtp_key
   FROM_EMAIL=your-verified-email@example.com
   FROM_NAME=Storage App
   ```

**✅ Pros:**
- 300 emails/day free
- Real email delivery
- No domain setup needed
- Good for production

---

## 🔵 Option 3: Mailgun - FREE

**Best for:** Production  
**Free tier:** 100 emails/day

### Setup Steps:

1. **Sign up:** https://www.mailgun.com
2. **Go to:** Sending → Domain Settings
3. **Use sandbox domain** (no domain verification needed for testing)
4. **Get SMTP credentials:**
   - SMTP Server: `smtp.mailgun.org`
   - Port: `587`
   - Username: Your SMTP username
   - Password: Your SMTP password

5. **Add to `.env.local`:**
   ```env
   EMAIL_PROVIDER=mailgun
   MAILGUN_SMTP_USER=your_smtp_username
   MAILGUN_SMTP_PASSWORD=your_smtp_password
   FROM_EMAIL=your-email@your-domain.com
   FROM_NAME=Storage App
   ```

**✅ Pros:**
- 100 emails/day free
- Real email delivery
- Good API

---

## 🔵 Option 4: Gmail (Free)

**Best for:** Personal projects  
**Free tier:** Unlimited (with limits)

### Setup Steps:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env.local`:**
   ```env
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Storage App
   ```

**✅ Pros:**
- Free
- Unlimited emails (with daily limits)
- Easy setup

**❌ Cons:**
- Daily sending limits
- Requires app password

---

## 🔵 Option 5: Custom SMTP

**For:** Any SMTP server

### Setup:

Add to `.env.local`:
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@example.com
FROM_NAME=Storage App
```

---

## 📋 Complete .env.local Example

```env
# Email Provider (ethereal, brevo, mailgun, gmail, custom)
EMAIL_PROVIDER=ethereal

# For Brevo
# BREVO_SMTP_USER=your_brevo_smtp_user
# BREVO_SMTP_PASSWORD=your_brevo_smtp_password

# For Mailgun
# MAILGUN_SMTP_USER=your_mailgun_user
# MAILGUN_SMTP_PASSWORD=your_mailgun_password

# For Gmail
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-app-password

# For Custom SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-username
# SMTP_PASSWORD=your-password

# Email sender info
FROM_EMAIL=noreply@example.com
FROM_NAME=Storage App
```

---

## 🚀 Quick Start (Ethereal - No Setup!)

1. **Add to `.env.local`:**
   ```env
   EMAIL_PROVIDER=ethereal
   ```

2. **That's it!** Start sending emails.

3. **Check console** for preview URLs when emails are sent.

---

## 🎯 Recommendation

- **Development/Testing:** Use `ethereal` (zero setup)
- **Production:** Use `brevo` (300 emails/day free) or `mailgun` (100 emails/day free)

---

## 📧 Email Features

- ✅ Email verification on signup
- ✅ Verification email with link
- ✅ Resend verification email
- ✅ Password reset (coming soon)

---

## 🆘 Troubleshooting

### Emails not sending?
- Check `.env.local` has correct provider
- Verify credentials are correct
- Check console for error messages
- For Ethereal: Check console for preview URLs

### Gmail not working?
- Make sure you're using App Password, not regular password
- Enable 2FA first
- Check "Less secure app access" is enabled (if needed)

### Brevo/Mailgun not working?
- Verify SMTP credentials
- Check if account is verified
- Ensure you're using SMTP credentials, not API keys

