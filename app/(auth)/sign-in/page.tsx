"use client";

import { Suspense } from "react";

import AuthForm from "@/features/auth/components/AuthForm";

const SignIn = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <AuthForm type="sign-in" />
  </Suspense>
);

export default SignIn;
