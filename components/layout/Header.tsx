"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  accountId: string;
  avatar?: string;
  searchSlot?: React.ReactNode;
  toggleSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
}

const Header = ({
  userId,
  accountId,
  avatar,
  searchSlot,
  toggleSlot,
  actionsSlot,
}: Props) => {
  const router = useRouter();
  const defaultAvatar = "https://ui-avatars.com/api/?name=User&background=random";

  return (
    <header className="header">
      {searchSlot || <div className="flex-1" />}

      <div className="header-wrapper">
        {toggleSlot}
        {actionsSlot}

        <Button 
          onClick={() => router.push("/profile")}
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
