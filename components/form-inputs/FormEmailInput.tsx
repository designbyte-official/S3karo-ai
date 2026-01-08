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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormEmailInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: any;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function FormEmailInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder = "you@example.com",
  disabled = false,
  autoComplete = "email",
  className,
  labelClassName,
  inputClassName,
}: FormEmailInputProps<TFieldValues, TName>) {
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
            <Input
              type="email"
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              className={cn("shad-input", inputClassName)}
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
