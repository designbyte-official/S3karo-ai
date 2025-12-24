"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  email: string;
}

const EmailVerificationBanner = ({ email }: EmailVerificationBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          description: "Verification email sent! Check your inbox.",
        });
      } else {
        toast({
          description: data.error || "Failed to resend verification email",
          className: "error-toast",
        });
      }
    } catch (error) {
      toast({
        description: "Failed to resend verification email",
        className: "error-toast",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
      <p className="text-sm text-blue-300 mb-2">
        Please verify your email address. Check your inbox for the verification link.
      </p>
      <Button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="text-xs h-8"
        variant="outline"
      >
        {isResending ? "Sending..." : "Resend Verification Email"}
      </Button>
    </div>
  );
};

export default EmailVerificationBanner;

