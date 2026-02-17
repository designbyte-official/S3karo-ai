"use client";

import React, { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import FileUploader from "@/components/common/FileUploader";
import Logo from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOutUser } from "@/features/auth/actions/user.actions";
import { navItems } from "@/features/shared/constants";
import { cn, getAvatarUrl } from "@/features/shared/utils";

interface Props {
  $id: string;
  accountId: string;
  fullName: string;
  avatar: string;
  email: string;
}

const MobileNavigation = ({ $id: ownerId, accountId, fullName, avatar, email: _email }: Props) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isPrivate = pathname.startsWith("/private");
  const mode = isPrivate ? "private" : "managed";

  const visibleNavItems = mode === "private" ? [] : navItems;

  return (
    <header className="mobile-header">
      <Logo variant="full" className="h-auto" />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Image src="/assets/icons/menu.svg" alt="Search" width={30} height={30} />
        </SheetTrigger>
        <SheetContent className="shad-sheet h-screen px-3">
          <SheetTitle>
            <div className="header-user">
              <Image
                src={getAvatarUrl(avatar, fullName)}
                alt=""
                width={44}
                height={44}
                className="header-user-avatar"
              />
              <div className="min-w-0 sm:hidden lg:block">
                <p className="subtitle-2 truncate capitalize">{fullName || "Account"}</p>
                <p className="caption text-light-200">Profile</p>
              </div>
            </div>
            <Separator className="mb-4 bg-light-200/20" />
          </SheetTitle>

          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {visibleNavItems.map(({ url, name, icon }) => (
                <li key={name} className="list-none">
                  <Link
                    href={url}
                    className={cn("mobile-nav-item lg:w-full", pathname === url && "shad-active")}
                    prefetch
                    onClick={() => setOpen(false)}
                  >
                    <Image
                      src={icon}
                      alt={name}
                      width={24}
                      height={24}
                      className={cn("nav-icon", pathname === url && "nav-icon-active")}
                    />
                    <p>{name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Separator className="my-5 bg-light-200/20" />

          <div className="flex flex-col justify-between gap-5 pb-5">
            <FileUploader ownerId={ownerId} accountId={accountId} mode={mode} />
            <Button
              type="submit"
              className="mobile-sign-out-button"
              onClick={async () => await signOutUser()}
            >
              <Image src="/assets/icons/logout.svg" alt="logo" width={24} height={24} />
              <p>Logout</p>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNavigation;
