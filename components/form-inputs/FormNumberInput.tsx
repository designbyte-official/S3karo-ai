"use client";

import * as React from "react";

import { Control, FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";

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

interface FormNumberInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export function FormNumberInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  placeholder,
  disabled = false,
  min,
  max,
  step,
  className,
  labelClassName,
  inputClassName,
}: FormNumberInputProps<TFieldValues, TName>) {
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
              type="number"
              placeholder={placeholder}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className={cn("shad-input", inputClassName)}
              {...field}
              onChange={(e) => {
                const value = e.target.value === "" ? "" : Number(e.target.value);
                field.onChange(value);
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage className="shad-form-message" />
        </FormItem>
      )}
    />
  );
}
