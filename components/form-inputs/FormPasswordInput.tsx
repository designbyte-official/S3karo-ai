"use client";

import * as React from "react";
import { FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormPasswordInputProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
    control: any;
    name: TName;
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    autoComplete?: string;
    showToggle?: boolean;
    className?: string;
    labelClassName?: string;
    inputClassName?: string;
}

export function FormPasswordInput<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    control,
    name,
    label,
    description,
    placeholder,
    disabled = false,
    autoComplete = "current-password",
    showToggle = true,
    className,
    labelClassName,
    inputClassName,
}: FormPasswordInputProps<TFieldValues, TName>) {
    const [showPassword, setShowPassword] = React.useState(false);

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
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder={placeholder}
                                disabled={disabled}
                                autoComplete={autoComplete}
                                className={cn("shad-input pr-10", inputClassName)}
                                {...field}
                            />
                            {showToggle && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-brand/10 text-light-200 hover:text-brand"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={disabled}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage className="shad-form-message" />
                </FormItem>
            )}
        />
    );
}
