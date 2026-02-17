"use client";

import { useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import Logo from "@/components/common/Logo";
import { navItems } from "@/constants";
import { getAvatarUrl } from "@/features/shared/utils";
import { cn } from "@/lib/utils";

const ALL_NAV_URLS = [
  ...navItems.map((n) => n.url),
  "/dashboard/profile",
  "/dashboard/profile/api-keys",
  "/dashboard/profile/subscription",
  "/private/explorer",
  "/private/settings",
];

interface NavItem {
  name: string;
  url: string;
  icon: string;
}

interface Props {
  fullName: string;
  avatar: string;
  email: string;
  mode?: "managed" | "private";
  navItems?: NavItem[];
}

const Sidebar = ({
  fullName,
  avatar,
  email: _email,
  mode: _mode = "managed",
  navItems: customNavItems,
}: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const avatarUrl = getAvatarUrl(avatar, fullName);

  useEffect(() => {
    ALL_NAV_URLS.forEach((url) => router.prefetch(url));
  }, [router]);

  // Profile navigation items (API Keys and Subscription)
  const profileNavItems = [
    { name: "API Keys", url: "/dashboard/profile/api-keys", icon: "/assets/icons/others.svg" },
    {
      name: "Subscription",
      url: "/dashboard/profile/subscription",
      icon: "/assets/icons/others.svg",
    },
  ];

  // Private S3 navigation items
  const privateNavItems = [
    { name: "S3 Explorer", url: "/private/explorer", icon: "/assets/icons/dashboard.svg" },
    { name: "S3 Settings", url: "/private/settings", icon: "/assets/icons/others.svg" },
    { name: "Profile", url: "/dashboard/profile", icon: "/assets/icons/others.svg" },
  ];

  // Determine which nav items to display
  let displayNavItems: NavItem[];
  if (pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/")) {
    displayNavItems = profileNavItems;
  } else if (pathname.startsWith("/private")) {
    displayNavItems = privateNavItems;
  } else {
    // Use custom nav items if provided, otherwise default to context-aware items
    displayNavItems = customNavItems || navItems;
  }

  return (
    <aside className="sidebar">
      <Logo variant="full" className="mb-2 hidden lg:flex" />
      <Logo variant="icon" className="mb-2 lg:hidden" />

      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-6">
          {displayNavItems.map(({ url, name, icon }) => {
            const isActive =
              pathname === url ||
              (url === "/dashboard/profile/api-keys" &&
                pathname.startsWith("/dashboard/profile/api-keys")) ||
              (url === "/dashboard/profile/subscription" &&
                pathname.startsWith("/dashboard/profile/subscription"));
            return (
              <li key={name} className="list-none">
                <Link
                  href={url}
                  className={cn("sidebar-nav-item lg:w-full", isActive && "shad-active")}
                  prefetch
                  // onClick={(e) => {
                  //   // When clicking the already-active item, prevent navigation so we don't
                  //   // trigger a pointless route transition (same page).
                  //   if (pathname === url) e.preventDefault();
                  // }}
                >
                  <Image
                    src={icon}
                    alt={name}
                    width={24}
                    height={24}
                    className={cn("nav-icon", isActive && "nav-icon-active")}
                  />
                  <p className={cn("hidden lg:block", isActive && "text-white")}>{name}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Image
        src="/assets/images/files-2.png"
        alt="logo"
        width={506}
        height={418}
        className="w-full"
      />

      <Link href="/dashboard/profile" className="sidebar-user-info text-inherit no-underline hover:opacity-90" prefetch>
        <Image src={avatarUrl} alt="" width={44} height={44} className="sidebar-user-avatar" />
        <div className="hidden min-w-0 lg:block">
          <p className="subtitle-2 truncate capitalize">{fullName || "Account"}</p>
          <p className="caption text-light-200">Profile</p>
        </div>
      </Link>
    </aside>
  );
};
export default Sidebar;
