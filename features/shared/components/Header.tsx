"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signOutUser } from "@/features/auth/actions/user.actions";

interface Props {
  userId: string;
  accountId: string;
  searchSlot?: React.ReactNode;
  toggleSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
}

const Header = ({
  userId,
  accountId,
  searchSlot,
  toggleSlot,
  actionsSlot,
}: Props) => {
  return (
    <header className="header">
      {searchSlot || <div className="flex-1" />}

      <div className="header-wrapper">
        {toggleSlot}
        {actionsSlot}

        <form action={signOutUser}>
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
