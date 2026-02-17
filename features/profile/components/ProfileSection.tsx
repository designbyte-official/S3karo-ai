import React from "react";

import { cn } from "@/features/shared/utils";

interface ProfileSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

const ProfileSectionComponent = ({ title, description, children, className, headerClassName }: ProfileSectionProps) => (
  <div className={cn("rounded-[18px] bg-white p-6 sm:p-8", className)}>
    {(title || description) && (
      <div className={cn("mb-6", headerClassName)}>
        {title && <h3 className="h3 text-brand">{title}</h3>}
        {description && <p className="body-2 mt-1 text-light-200">{description}</p>}
      </div>
    )}
    <div className="space-y-4">{children}</div>
  </div>
);
ProfileSectionComponent.displayName = "ProfileSection";

export const ProfileSection = React.memo(ProfileSectionComponent);
