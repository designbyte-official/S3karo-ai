"use client";

import React from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  href?: string;
}

const Logo = ({ variant = "full", className, href = "/" }: LogoProps) => {
  const iconSize = variant === "full" ? 40 : 32;

  const logoContent = (
    <div className={cn("flex items-center gap-3 group", className)}>
      {/* Premium S3Karo Icon - Cloud with Hexagonal Bucket */}
      <div className="relative shrink-0">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-110"
        >
          {/* Cloud base with gradient */}
          <defs>
            <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FA7275" />
              <stop offset="100%" stopColor="#EA6365" />
            </linearGradient>
          </defs>

          {/* Left cloud curve */}
          <path
            d="M8 28C8 28 6 28 6 26C6 24 8 24 8 24C8 20 11 17 15 17C16 17 17 17.3 18 17.8"
            stroke="url(#brandGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right cloud curve */}
          <path
            d="M30 17.8C31 17.3 32 17 33 17C37 17 40 20 40 24C40 24 42 24 42 26C42 28 40 28 40 28"
            stroke="url(#brandGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Top cloud curve */}
          <path
            d="M18 17.8C18.5 16.2 20 15 22 15C23 15 24 15.3 24.5 16C25 15.3 26 15 27 15C29 15 30.5 16.2 31 17.8"
            stroke="url(#brandGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Hexagonal S3 Bucket in center */}
          <path
            d="M24 20L28.5 22.5V27.5L24 30L19.5 27.5V22.5L24 20Z"
            fill="url(#brandGradient)"
            className="transition-opacity duration-300 group-hover:opacity-80"
          />

          {/* S3 text inside hexagon */}
          <text
            x="24"
            y="27"
            fontSize="7"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
            className="select-none"
          >
            S3
          </text>

          {/* Security shield accent */}
          <path
            d="M24 31L24 33C24 33 26 33.5 26 35.5C26 36.5 25.5 37 24 37C22.5 37 22 36.5 22 35.5C22 33.5 24 33 24 33L24 31Z"
            fill="url(#brandGradient)"
            opacity="0.6"
          />
        </svg>
      </div>

      {variant === "full" && (
        <span className="text-xl font-bold tracking-tight text-brand transition-colors duration-300 group-hover:text-brand-100 lg:text-2xl">
          S3Karo
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default Logo;
