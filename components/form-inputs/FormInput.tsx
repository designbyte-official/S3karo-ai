"use client";

import * as React from "react";

import { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
    // Form control props
    control: any; // Control from useForm
    name: TName;

    // Label and description
    label?: string;
    description?: string;
    placeholder?: string;

    // Input props
    type?: React.HTMLInputTypeAttribute;
    disabled?: boolean;
    autoComplete?: string;

    // Styling
    className?: string;
    labelClassName?: string;
    inputClassName?: string;

    // Custom render function for advanced use cases
    renderInput?: (field: ControllerRenderProps<TFieldValues, TName>) => React.ReactNode;
}

export function FormInput<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    control,
    name,
    label,
    description,
    placeholder,
    type = "text",
    disabled = false,
    autoComplete,
    className,
    labelClassName,
    inputClassName,
    renderInput,
}: FormInputProps<TFieldValues, TName>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }: { field: ControllerRenderProps<TFieldValues, TName> }) => (
                <FormItem className={cn("shad-form-item", className)}>
                    {label && (
                        <FormLabel className={cn("shad-form-label", labelClassName)}>
                            {label}
                        </FormLabel>
                    )}
                    <FormControl>
                        {renderInput ? (
                            renderInput(field)
                        ) : (
                            <Input
                                type={type}
                                placeholder={placeholder}
                                disabled={disabled}
                                autoComplete={autoComplete}
                                className={cn("shad-input", inputClassName)}
                                {...field}
                            />
                        )}
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage className="shad-form-message" />
                </FormItem>
            )}
        />
    );
}
