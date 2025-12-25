"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import StorageModeToggle from "@/components/StorageModeToggle";
import { signOutUser } from "@/lib/actions/user.actions";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import { usePathname } from "next/navigation";

const Header = ({
  userId,
  accountId,
}: {
  userId: string;
  accountId: string;
}) => {
  const mode = s3ConfigService.getMode();
  const path = usePathname();
  const isOwnS3 = mode === 'own-s3';

  return (
    <header className="header">
      {!isOwnS3 && <Search />}
      {isOwnS3 && <div className="flex-1" />}

      <div className="header-wrapper">
        <StorageModeToggle />
        {!isOwnS3 && <FileUploader ownerId={userId} accountId={accountId} />}

        <form
          action={signOutUser}
        >
          <Button type="submit" className="sign-out-button">
            <Image
              src="/assets/icons/logout.svg"
              alt="logo"
              width={24}
              height={24}
              className="w-6"
            />
          </Button>
        </form>
      </div>
    </header>
  );
};
export default Header;
