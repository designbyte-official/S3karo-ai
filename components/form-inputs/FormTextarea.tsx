"use client";

import * as React from "react";

import { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FormTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: any;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  labelClassName?: string;
  textareaClassName?: string;
}

export function FormTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  rows = 4,
  className,
  labelClassName,
  textareaClassName,
}: FormTextareaProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }: { field: ControllerRenderProps<TFieldValues, TName> }) => (
        <FormItem className={cn("shad-form-item", className)}>
          {label && (
            <FormLabel className={cn("shad-form-label", labelClassName)}>{label}</FormLabel>
          )}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={cn("shad-input resize-none", textareaClassName)}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage className="shad-form-message" />
        </FormItem>
      )}
    />
  );
}
