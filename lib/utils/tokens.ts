import crypto from "crypto";

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate token expiry (24 hours from now)
export function getVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

// Generate password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate password reset token expiry (1 hour from now)
export function getPasswordResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

// Check if token is expired
export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
}
