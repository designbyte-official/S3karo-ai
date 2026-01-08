import { useState } from "react";

import { useRouter } from "next/navigation";

import { z } from "zod";

export const authFormSchema = (formType: "sign-in" | "sign-up") => {
  return z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: formType === "sign-up" ? z.string().min(2).max(50) : z.string().optional(),
  });
};

export const useAuthForm = (type: "sign-in" | "sign-up") => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (values: z.infer<ReturnType<typeof authFormSchema>>) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = type === "sign-up" ? "/api/auth/signup" : "/api/auth/signin";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          fullName: values.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setErrorMessage(
            data.message ||
              "Please verify your email address before signing in. Check your inbox for the verification email."
          );
        } else {
          setErrorMessage(data.error || "Failed to authenticate. Please try again.");
        }
        return;
      }

      if (type === "sign-up" && data.message) {
        setErrorMessage("");
        alert(data.message || "Account created! Please check your email to verify your account.");
      }

      if (type === "sign-in" || data.user?.emailVerified === "true") {
        router.push("/dashboard");
        router.refresh();
      } else if (type === "sign-up") {
        router.push("/sign-in?message=Please verify your email to continue");
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    errorMessage,
    setErrorMessage,
    onSubmit,
  };
};
