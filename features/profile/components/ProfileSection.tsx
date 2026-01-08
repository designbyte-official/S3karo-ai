import React from "react";
import { cn } from "@/features/shared/utils";

interface ProfileSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export const ProfileSection = ({
    title,
    description,
    children,
    className,
    headerClassName
}: ProfileSectionProps) => {
    return (
        <section className={cn("rounded-[18px] border border-light-300 bg-white p-6 shadow-sm", className)}>
            {(title || description) && (
                <div className={cn("mb-6 border-b border-light-300 pb-6", headerClassName)}>
                    {title && <h2 className="h2 text-brand">{title}</h2>}
                    {description && <p className="body-2 mt-1 text-light-200">{description}</p>}
                </div>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
};
