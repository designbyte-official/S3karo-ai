"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { getCurrentUser } from "@/features/auth/actions/user.actions";

export const LandingNav = () => {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            ...currentUser,
            avatar: currentUser.avatar || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch user in LandingNav:", err);
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [user, setUser]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Logo variant="full" href="/" />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard/profile">
                  <Button variant="ghost" className="h-[52px] px-6 rounded-full button">
                    Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="primary-btn h-[52px] px-8">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="h-[52px] px-6 rounded-full button">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="primary-btn h-[52px] px-8">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
