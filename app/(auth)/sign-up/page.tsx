import { Suspense } from "react";
import AuthForm from "@/features/auth/components/AuthForm";

const SignUp = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <AuthForm type="sign-up" />
    </Suspense>
);

export default SignUp;
