"use client";

import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStorageMode } from "@/lib/s3/config";
import { useEffect, useState } from "react";

interface Props {
  fullName: string;
  avatar: string;
  email: string;
}

const Sidebar = ({ fullName, avatar, email }: Props) => {
  const pathname = usePathname();
  const [storageMode, setStorageMode] = useState<'own-s3' | 'platform-s3' | 'appwrite'>('appwrite');

  useEffect(() => {
    // Check storage mode on mount and when it changes
    const updateMode = () => {
      const mode = getStorageMode();
      setStorageMode(mode as 'own-s3' | 'platform-s3' | 'appwrite');
    };
    
    updateMode();
    
    // Listen for storage changes (when switching modes)
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        updateMode();
      };
      
      // Listen to storage events (for cross-tab updates)
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for same-tab changes
      const interval = setInterval(updateMode, 1000);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  // All nav items work with S3 (Dashboard, Documents, Images, Media, Others)
  // They all use direct S3 operations, so show all items for own-s3 mode
  const visibleNavItems = navItems;

  return (
    <aside className="sidebar">
      <Link href="/">
        <Image
          src="/assets/icons/logo-full-brand.svg"
          alt="logo"
          width={160}
          height={50}
          className="hidden h-auto lg:block"
        />

        <Image
          src="/assets/icons/logo-brand.svg"
          alt="logo"
          width={52}
          height={52}
          className="lg:hidden"
        />
      </Link>

      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-6">
          {storageMode === 'own-s3' ? (
            <Link href="/own-s3" className="lg:w-full">
              <li
                className={cn(
                  "sidebar-nav-item",
                  pathname === "/own-s3" && "shad-active",
                )}
              >
                <Image
                  src="/assets/icons/dashboard.svg"
                  alt="Own S3"
                  width={24}
                  height={24}
                  className={cn(
                    "nav-icon",
                    pathname === "/own-s3" && "nav-icon-active",
                  )}
                />
                <p className="hidden lg:block">Own S3 Files</p>
              </li>
            </Link>
          ) : (
            visibleNavItems.map(({ url, name, icon }) => (
              <Link key={name} href={url} className="lg:w-full">
                <li
                  className={cn(
                    "sidebar-nav-item",
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
                  <p className="hidden lg:block">{name}</p>
                </li>
              </Link>
            ))
          )}
        </ul>
      </nav>

      <Image
        src="/assets/images/files-2.png"
        alt="logo"
        width={506}
        height={418}
        className="w-full"
      />

      <div className="sidebar-user-info">
        <Image
          src={avatar}
          alt="Avatar"
          width={44}
          height={44}
          className="sidebar-user-avatar"
        />
        <div className="hidden lg:block">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
