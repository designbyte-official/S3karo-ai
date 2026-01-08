"use client";

import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/common/Logo";

interface Props {
    fullName: string;
    avatar: string;
    email: string;
    mode?: 'managed' | 'private';
    navItems?: any[];
}

const Sidebar = ({ fullName, avatar, email, mode = 'managed', navItems: customNavItems }: Props) => {
    const pathname = usePathname();

    // Profile navigation items (API Keys and Subscription)
    const profileNavItems = [
        { name: "API Keys", url: "/dashboard/profile/api-keys", icon: "/assets/icons/others.svg" },
        { name: "Subscription", url: "/dashboard/profile/subscription", icon: "/assets/icons/others.svg" },
    ];

    // Private S3 navigation items
    const privateNavItems = [
        { name: "S3 Explorer", url: "/private/explorer", icon: "/assets/icons/dashboard.svg" },
        { name: "S3 Settings", url: "/private/settings", icon: "/assets/icons/others.svg" },
        { name: "Profile", url: "/dashboard/profile", icon: "/assets/icons/others.svg" },
    ];

    // Determine which nav items to display
    let displayNavItems: any[];
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
            <Logo
                variant="full"
                className="hidden lg:flex mb-2"
            />
            <Logo
                variant="icon"
                className="lg:hidden mb-2"
            />

            <nav className="sidebar-nav">
                <ul className="flex flex-1 flex-col gap-6">
                    {displayNavItems.map(({ url, name, icon }) => {
                        const isActive = pathname === url || (url === "/dashboard/profile/api-keys" && pathname.startsWith("/dashboard/profile/api-keys")) || (url === "/dashboard/profile/subscription" && pathname.startsWith("/dashboard/profile/subscription"));
                        return (
                            <Link key={name} href={url} className="lg:w-full">
                                <li
                                    className={cn(
                                        "sidebar-nav-item",
                                        isActive && "shad-active",
                                    )}
                                >
                                    <Image
                                        src={icon}
                                        alt={name}
                                        width={24}
                                        height={24}
                                        className={cn(
                                            "nav-icon",
                                            isActive && "nav-icon-active",
                                        )}
                                    />
                                    <p className={cn(
                                        "hidden lg:block",
                                        isActive && "text-white"
                                    )}>{name}</p>
                                </li>
                            </Link>
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
