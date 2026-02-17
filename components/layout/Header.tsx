"use client";

import React from "react";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import FileUploader from "@/components/common/FileUploader";
import Search from "@/components/common/Search";
import StorageModeToggle from "@/components/common/StorageModeToggle";
import { Button } from "@/components/ui/button";
import { getAvatarUrl } from "@/features/shared/utils";

interface Props {
  userId: string;
  accountId: string;
  avatar?: string;
  fullName?: string;
}

const Header = ({ userId, accountId, avatar, fullName }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const avatarUrl = getAvatarUrl(avatar, fullName);

  const isPrivate = pathname.startsWith("/private");
  const mode = isPrivate ? "private" : "managed";

  return (
    <header className="header">
      <Search mode={mode} />

      <div className="header-wrapper">
        <StorageModeToggle />

        <FileUploader ownerId={userId} accountId={accountId} mode={mode} />

        <Button onClick={() => router.push("/dashboard/profile")} className="sign-out-button">
          <Image
            src={avatarUrl}
            alt="Profile"
            width={24}
            height={24}
            className="size-6 rounded-full object-cover"
          />
        </Button>
      </div>
    </header>
  );
};

export default Header;
