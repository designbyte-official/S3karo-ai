"use client";

import AuthForm from "@/components/AuthForm";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SignIn = () => {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const msg = searchParams.get("message");
    
    if (verified === "true") {
      setMessage("Email verified successfully! You can now sign in.");
    } else if (msg) {
      setMessage(msg);
    }
  }, [searchParams]);

  return (
    <>
      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 text-green-300 text-sm">
          {message}
        </div>
      )}
      <AuthForm type="sign-in" />
    </>
  );
};

export default SignIn;
