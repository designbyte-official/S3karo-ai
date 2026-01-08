"use client";

import * as React from "react";

import { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface FormCheckboxProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
    control: any;
    name: TName;
    label?: string;
    description?: string;
    disabled?: boolean;
    className?: string;
    labelClassName?: string;
}

export function FormCheckbox<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    control,
    name,
    label,
    description,
    disabled = false,
    className,
    labelClassName,
}: FormCheckboxProps<TFieldValues, TName>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }: { field: ControllerRenderProps<TFieldValues, TName> }) => (
                <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0", className)}>
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        {label && (
                            <FormLabel className={cn(labelClassName)}>
                                {label}
                            </FormLabel>
                        )}
                        {description && <FormDescription>{description}</FormDescription>}
                    </div>
                    <FormMessage className="shad-form-message" />
                </FormItem>
            )}
        />
    );
}
