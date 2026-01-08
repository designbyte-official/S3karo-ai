"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Search from "@/components/common/Search";
import StorageModeToggle from "@/components/common/StorageModeToggle";
import FileUploader from "@/components/common/FileUploader";

interface Props {
  userId: string;
  accountId: string;
  avatar?: string;
}

const Header = ({
  userId,
  accountId,
  avatar,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const defaultAvatar = "https://ui-avatars.com/api/?name=User&background=random";

  const isPrivate = pathname.startsWith("/private");
  const mode = isPrivate ? "private" : "managed";

  return (
    <header className="header">
      <Search mode={mode} />

      <div className="header-wrapper">
        <StorageModeToggle />

        <FileUploader ownerId={userId} accountId={accountId} mode={mode} />

        <Button
          onClick={() => router.push("/dashboard/profile")}
          className="sign-out-button"
        >
          <Image
            src={avatar || defaultAvatar}
            alt="Profile"
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
          />
        </Button>
      </div>
    </header>
  );
};

export default Header;
