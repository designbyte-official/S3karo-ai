"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export const ScrollableDialog = ({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
  maxWidth = "lg",
}: ScrollableDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "shad-dialog max-h-[90vh] flex flex-col !p-0",
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-light-300 flex-shrink-0">
          <DialogTitle className="text-center text-light-100">{title}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Fixed Footer with Action Buttons */}
        {footer && (
          <div className="px-6 pt-4 pb-6 border-t border-light-300 flex-shrink-0 bg-white">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

