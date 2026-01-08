// Email service configuration
// Multiple free SMTP options - no domain setup required!

export const emailConfig = {
  // Choose your SMTP provider
  provider: (process.env.EMAIL_PROVIDER || "ethereal") as
    | "ethereal"
    | "brevo"
    | "mailgun"
    | "gmail"
    | "custom",

  // Ethereal Email (FREE - No signup! Perfect for testing)
  // Generates credentials automatically - no setup needed
  ethereal: {
    // Credentials generated automatically, no config needed
  },

  // Brevo (formerly Sendinblue) - FREE tier: 300 emails/day
  // Sign up: https://www.brevo.com
  brevo: {
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    user: process.env.BREVO_SMTP_USER || "",
    password: process.env.BREVO_SMTP_PASSWORD || "",
  },

  // Mailgun - FREE tier: 100 emails/day
  // Sign up: https://www.mailgun.com
  mailgun: {
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    user: process.env.MAILGUN_SMTP_USER || "",
    password: process.env.MAILGUN_SMTP_PASSWORD || "",
  },

  // Gmail (requires app password)
  gmail: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: process.env.GMAIL_USER || "",
    password: process.env.GMAIL_APP_PASSWORD || "",
  },

  // Custom SMTP (any provider)
  custom: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
  },

  // Email sender info
  from: {
    email: process.env.FROM_EMAIL || "noreply@example.com",
    name: process.env.FROM_NAME || "Storage App",
  },

  // App URL for verification links
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
