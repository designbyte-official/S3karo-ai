"use client";

import { useEffect } from "react";

import Link from "next/link";

import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export const LandingNav = () => {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            ...currentUser,
            avatar: currentUser.avatar || "",
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
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Logo variant="full" href="/" />
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard/profile">
                  <Button variant="ghost" className="button h-[52px] rounded-full px-6">
                    Profile
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="primary-btn h-[52px] px-8">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="button h-[52px] rounded-full px-6">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="primary-btn h-[52px] px-8">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
