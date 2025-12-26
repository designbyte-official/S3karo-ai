"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  href?: string;
  textColor?: "brand" | "white";
}

const Logo = ({ 
  variant = "full", 
  className,
  href = "/",
  textColor = "brand",
}: LogoProps) => {
  const iconSize = variant === "full" ? 40 : 32;
  const textColorClass = textColor === "white" ? "text-white" : "text-brand";
  
  const logoContent = (
    <div className={cn("flex items-center gap-3", className)}>
      {/* S3 Storage Icon - Simple cloud icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("flex-shrink-0", textColorClass)}
      >
        {/* Cloud shape */}
        <path
          d="M28 17C29.6569 17 31 18.3431 31 20C31 20.5523 31.4477 21 32 21C33.1046 21 34 21.8954 34 23C34 24.1046 33.1046 25 32 25H12C10.8954 25 10 24.1046 10 23C10 21.8954 10.8954 21 12 21H13C13 18.7909 14.7909 17 17 17C18.3807 17 19.6307 17.5571 20.5355 18.4645C21.2092 19.1382 21.6235 20.0117 21.7461 20.9648C21.9101 20.988 22.0787 21 22.25 21C24.3211 21 26 22.6789 26 24.75V25H28C29.1046 25 30 24.1046 30 23C30 21.8954 29.1046 21 28 21H27C27 19.3431 27.6569 17.6569 28 17Z"
          fill="currentColor"
        />
      </svg>
      
      {variant === "full" && (
        <span className={cn("font-bold text-xl lg:text-2xl tracking-tight", textColorClass)}>
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

