"use client";

import * as React from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * ScrollableDialog - A reusable dialog component with fixed header, scrollable content, and fixed footer
 *
 * @example
 * ```tsx
 * <ScrollableDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="My Dialog Title"
 *   maxWidth="lg"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={handleSave}>Save</Button>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     </div>
 *   }
 * >
 *   <div>Your scrollable content here</div>
 * </ScrollableDialog>
 * ```
 */
interface ScrollableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  fullScreen?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

export const ScrollableDialog = ({
  open,
  onOpenChange,
  title,
  header,
  children,
  footer,
  className,
  maxWidth = "lg",
  fullScreen = false,
}: ScrollableDialogProps) => {
  const isFullScreen = fullScreen || maxWidth === "full";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "shad-dialog flex flex-col !p-0",
          isFullScreen
            ? "!w-[100vw] !h-[100vh] !max-w-[100vw] !max-h-[100vh] !left-0 !top-0 !translate-x-0 !translate-y-0 !m-0 rounded-none"
            : cn("max-h-[90vh]", maxWidthClasses[maxWidth]),
          className
        )}
      >
        {/* Fixed Header */}
        {(title || header) && (
          <DialogHeader
            className={cn(
              "flex-shrink-0 border-b",
              isFullScreen
                ? "px-6 py-4 border-slate-200 flex flex-row items-center justify-between"
                : "px-6 pt-6 pb-4 border-light-300"
            )}
          >
            {header ||
              (title && (
                <DialogTitle
                  className={cn(
                    isFullScreen
                      ? "text-lg font-semibold text-slate-800 truncate flex-1"
                      : "text-center text-light-100"
                  )}
                >
                  {title}
                </DialogTitle>
              ))}
          </DialogHeader>
        )}

        {/* Scrollable Content */}
        <div className={cn("flex-1 overflow-y-auto min-h-0", isFullScreen ? "p-6" : "px-6 py-4")}>
          {children}
        </div>

        {/* Fixed Footer with Action Buttons */}
        {footer && (
          <div
            className={cn(
              "flex-shrink-0 border-t",
              isFullScreen
                ? "px-6 py-4 border-slate-200"
                : "px-6 pt-4 pb-6 border-light-300 bg-white"
            )}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
