"use client";

import React from "react";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Use these paths for favicon, manifest, or meta tags */
export const LOGO_ICON_PATH = "/assets/logos/icon-logo.webp";
export const LOGO_NAME_PATH = "/assets/logos/name-logo.webp";

export interface LogoProps {
  /** "icon" = icon only, "name" = wordmark only, "full" = icon + name */
  variant?: "icon" | "name" | "full";
  className?: string;
  /** Link URL; if set, logo is wrapped in Link. Pass "" or null to render without link. */
  href?: string | null;
  /** Icon size in px (variant icon or full) */
  iconSize?: number;
  /** Name/wordmark height in px (variant name or full). Width auto. */
  nameHeight?: number;
  /** Preload for LCP (e.g. above-the-fold nav) */
  priority?: boolean;
  /** Alt text for icon */
  iconAlt?: string;
  /** Alt text for name (when used alone or in full) */
  nameAlt?: string;
}

const Logo = ({
  variant = "full",
  className,
  href = "/",
  iconSize = 40,
  nameHeight = 28,
  priority = false,
  iconAlt = "S3Karo",
  nameAlt = "S3Karo",
}: LogoProps) => {
  const iconNode =
    variant === "icon" || variant === "full" ? (
      <Image
        src={LOGO_ICON_PATH}
        alt={iconAlt}
        width={iconSize}
        height={iconSize}
        className={cn("shrink-0 transition-transform duration-300 group-hover:scale-110", variant === "icon" && "block")}
        priority={priority}
        unoptimized={false}
      />
    ) : null;

  const nameNode =
    variant === "name" || variant === "full" ? (
      <Image
        src={LOGO_NAME_PATH}
        alt={nameAlt}
        width={140}
        height={nameHeight}
        className={cn(
          "shrink-0 object-contain object-left transition-opacity duration-300 group-hover:opacity-90",
          variant === "name" && "block"
        )}
        priority={priority}
        unoptimized={false}
      />
    ) : null;

  const content = (
    <div className={cn("group flex items-center gap-3", className)}>
      {iconNode}
      {nameNode}
    </div>
  );

  if (href != null && href !== "") {
    return (
      <Link href={href} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
