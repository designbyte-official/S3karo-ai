import nodemailer from "nodemailer";

import { emailConfig } from "./config";

// Create SMTP transporter based on provider
async function createTransporter() {
  switch (emailConfig.provider) {
    case "ethereal":
      // Ethereal Email - FREE, no signup, generates credentials automatically
      // Perfect for testing and development
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    
    case "brevo":
      if (!emailConfig.brevo.user || !emailConfig.brevo.password) {
        throw new Error("BREVO_SMTP_USER and BREVO_SMTP_PASSWORD must be set");
      }
      return nodemailer.createTransport({
        host: emailConfig.brevo.host,
        port: emailConfig.brevo.port,
        secure: emailConfig.brevo.secure,
        auth: {
          user: emailConfig.brevo.user,
          pass: emailConfig.brevo.password,
        },
      });
    
    case "mailgun":
      if (!emailConfig.mailgun.user || !emailConfig.mailgun.password) {
        throw new Error("MAILGUN_SMTP_USER and MAILGUN_SMTP_PASSWORD must be set");
      }
      return nodemailer.createTransport({
        host: emailConfig.mailgun.host,
        port: emailConfig.mailgun.port,
        secure: emailConfig.mailgun.secure,
        auth: {
          user: emailConfig.mailgun.user,
          pass: emailConfig.mailgun.password,
        },
      });
    
    case "gmail":
      if (!emailConfig.gmail.user || !emailConfig.gmail.password) {
        throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
      }
      return nodemailer.createTransport({
        host: emailConfig.gmail.host,
        port: emailConfig.gmail.port,
        secure: emailConfig.gmail.secure,
        auth: {
          user: emailConfig.gmail.user,
          pass: emailConfig.gmail.password,
        },
      });
    
    case "custom":
      if (!emailConfig.custom.user || !emailConfig.custom.password || !emailConfig.custom.host) {
        throw new Error("SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be set");
      }
      return nodemailer.createTransport({
        host: emailConfig.custom.host,
        port: emailConfig.custom.port,
        secure: emailConfig.custom.secure,
        auth: {
          user: emailConfig.custom.user,
          pass: emailConfig.custom.password,
        },
      });
    
    default:
      throw new Error(`Unknown email provider: ${emailConfig.provider}`);
  }
}

// Main email sender function
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to,
      subject,
      html,
    });

    // For Ethereal Email, log the preview URL (emails don't actually send)
    if (emailConfig.provider === "ethereal") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("📧 Email sent! Preview URL:", previewUrl);
      console.log("💡 Note: Ethereal emails don't actually send - use for testing only");
    }

    return info;
  } catch (error: any) {
    console.error("Email send error:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Send verification email
export async function sendVerificationEmail(email: string, token: string, fullName: string) {
  const verificationUrl = `${emailConfig.appUrl}/api/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Verify Your Email Address</h1>
        <p>Hi ${fullName},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" class="button">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <div class="footer">
          <p>Best regards,<br>Storage App Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(
    email,
    "Verify Your Email Address",
    html
  );
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string, fullName: string) {
  const resetUrl = `${emailConfig.appUrl}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hi ${fullName},</p>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
          <p>Best regards,<br>Storage App Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(
    email,
    "Reset Your Password",
    html
  );
}

