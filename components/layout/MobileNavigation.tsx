"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { navItems } from "@/features/shared/constants";
import Link from "next/link";
import { cn } from "@/features/shared/utils";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/common/FileUploader";
import { signOutUser } from "@/features/auth/actions/user.actions";

import { s3ConfigService, StorageMode } from "@/features/private-s3/services/s3-config.service";

interface Props {
  $id: string;
  accountId: string;
  fullName: string;
  avatar: string;
  email: string;
}

const MobileNavigation = ({
  $id: ownerId,
  accountId,
  fullName,
  avatar,
  email,
}: Props) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [storageMode, setStorageMode] = useState<StorageMode>('managed-storage');

  useEffect(() => {
    setStorageMode(s3ConfigService.getMode());
  }, []);

  const visibleNavItems = storageMode === 'own-s3' ? [] : navItems;

  return (
    <header className="mobile-header">
      <Image
        src="/assets/icons/logo-full-brand.svg"
        alt="logo"
        width={120}
        height={52}
        className="h-auto"
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Image
            src="/assets/icons/menu.svg"
            alt="Search"
            width={30}
            height={30}
          />
        </SheetTrigger>
        <SheetContent className="shad-sheet h-screen px-3">
          <SheetTitle>
            <div className="header-user">
              <Image
                src={avatar}
                alt="avatar"
                width={44}
                height={44}
                className="header-user-avatar"
              />
              <div className="sm:hidden lg:block">
                <p className="subtitle-2 capitalize">{fullName}</p>
                <p className="caption">{email}</p>
              </div>
            </div>
            <Separator className="mb-4 bg-light-200/20" />
          </SheetTitle>

          <nav className="mobile-nav">
            <ul className="mobile-nav-list">
              {visibleNavItems.map(({ url, name, icon }) => (
                <Link key={name} href={url} className="lg:w-full">
                  <li
                    className={cn(
                      "mobile-nav-item",
                      pathname === url && "shad-active",
                    )}
                  >
                    <Image
                      src={icon}
                      alt={name}
                      width={24}
                      height={24}
                      className={cn(
                        "nav-icon",
                        pathname === url && "nav-icon-active",
                      )}
                    />
                    <p>{name}</p>
                  </li>
                </Link>
              ))}
            </ul>
          </nav>

          <Separator className="my-5 bg-light-200/20" />

          <div className="flex flex-col justify-between gap-5 pb-5">
            <FileUploader ownerId={ownerId} accountId={accountId} />
            <Button
              type="submit"
              className="mobile-sign-out-button"
              onClick={async () => await signOutUser()}
            >
              <Image
                src="/assets/icons/logout.svg"
                alt="logo"
                width={24}
                height={24}
              />
              <p>Logout</p>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default MobileNavigation;
