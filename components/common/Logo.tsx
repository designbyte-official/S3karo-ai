"use client";

import React from "react";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Use these paths for favicon, manifest, or meta tags */
export const LOGO_ICON_PATH = "/assets/logos/icon-logo.webp";
export const LOGO_NAME_PATH = "/assets/logos/name-logo.webp";

export interface LogoProps {
  /** "icon" = icon only, "name" | "full" = combined logo (icon + text in one image). Never both at once. */
  variant?: "icon" | "name" | "full";
  className?: string;
  /** Link URL; if set, logo is wrapped in Link. Pass "" or null to render without link. */
  href?: string | null;
  /** Icon size in px (variant icon only) */
  iconSize?: number;
  /** Height in px for name/full logo. Width auto. */
  nameHeight?: number;
  /** Preload for LCP (e.g. above-the-fold nav) */
  priority?: boolean;
  /** Alt text */
  iconAlt?: string;
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
  const isIconOnly = variant === "icon";
  const isNameOrFull = variant === "name" || variant === "full";

  const content = (
    <div className={cn("group flex items-center", className)}>
      {isIconOnly && (
        <Image
          src={LOGO_ICON_PATH}
          alt={iconAlt}
          width={iconSize}
          height={iconSize}
          className="shrink-0 transition-transform duration-300 group-hover:scale-110"
          priority={priority}
          unoptimized={false}
        />
      )}
      {isNameOrFull && (
        <Image
          src={LOGO_NAME_PATH}
          alt={nameAlt}
          width={140}
          height={nameHeight}
          className="shrink-0 object-contain object-left transition-opacity duration-300 group-hover:opacity-90"
          priority={priority}
          unoptimized={false}
        />
      )}
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
