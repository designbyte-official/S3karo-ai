"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    bucket: z.string().min(1, "Bucket name is required"),
    region: z.string().min(1, "Region is required"),
    accessKeyId: z.string().min(1, "Access Key ID is required"),
    secretAccessKey: z.string().min(1, "Secret Access Key is required"),
    endpoint: z.string().optional(),
});

interface S3ConfigFormProps {
    userId: string;
    onConfigSaved?: () => void;
    defaultValues?: Partial<z.infer<typeof formSchema>>;
}

export const S3ConfigForm = ({ userId, onConfigSaved, defaultValues }: S3ConfigFormProps) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!defaultValues?.bucket);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bucket: defaultValues?.bucket || "",
            region: defaultValues?.region || "",
            accessKeyId: defaultValues?.accessKeyId || "",
            secretAccessKey: defaultValues?.secretAccessKey || "",
            endpoint: defaultValues?.endpoint || "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            await s3ConfigService.saveConfig(userId, {
                ...values,
                bucketName: values.bucket, // Ensure backward compatibility if needed
            });

            toast({
                className: "success-toast",
                title: "Configuration Saved",
                description: "Your S3 details have been securely stored locally.",
            });

            if (onConfigSaved) onConfigSaved();

            // Force a small delay to ensure local storage propagates if window event listener isn't perfect
            setTimeout(() => {
                window.dispatchEvent(new Event('storage'));
                router.refresh();
                setIsEditMode(false);
            }, 100);

        } catch (error) {
            console.error(error);
            toast({
                className: "error-toast",
                title: "Error",
                description: "Failed to save configuration.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        if (confirm("Are you sure you want to remove your S3 configuration? This will clear the details from your browser.")) {
            await s3ConfigService.clearConfig(userId);
            form.reset({
                bucket: "",
                region: "",
                accessKeyId: "",
                secretAccessKey: "",
                endpoint: "",
            });
            setIsEditMode(true);
            toast({
                title: "Configuration Reset",
                description: "Local configuration has been cleared.",
            });
            window.dispatchEvent(new Event('storage'));
            router.refresh();
        }
    };

    if (!isEditMode && defaultValues) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">
                        ✓
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">S3 Configured</h3>
                        <p className="text-sm opacity-80">Using bucket: <strong>{defaultValues.bucket}</strong></p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button variant="outline" className="w-full border-red/20 text-red hover:bg-red/5 hover:text-red" onClick={handleReset}>
                        Reset Configuration
                    </Button>
                    <Button className="shad-submit-btn w-full" onClick={() => setIsEditMode(true)}>
                        Edit Details
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="accessKeyId"
                        render={({ field }) => (
                            <FormItem className="shad-form-item">
                                <FormLabel className="shad-form-label">Access Key ID</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="AKIA..." className="shad-input" {...field} />
                                </FormControl>
                                <FormMessage className="shad-form-message" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="secretAccessKey"
                        render={({ field }) => (
                            <FormItem className="shad-form-item">
                                <FormLabel className="shad-form-label">Secret Access Key</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="wJalr..." className="shad-input" {...field} />
                                </FormControl>
                                <FormMessage className="shad-form-message" />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="bucket"
                        render={({ field }) => (
                            <FormItem className="shad-form-item">
                                <FormLabel className="shad-form-label">Bucket Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="my-app-bucket" className="shad-input" {...field} />
                                </FormControl>
                                <FormMessage className="shad-form-message" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                            <FormItem className="shad-form-item">
                                <FormLabel className="shad-form-label">Region</FormLabel>
                                <FormControl>
                                    <Input placeholder="us-east-1" className="shad-input" {...field} />
                                </FormControl>
                                <FormMessage className="shad-form-message" />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="endpoint"
                    render={({ field }) => (
                        <FormItem className="shad-form-item">
                            <FormLabel className="shad-form-label">Custom Endpoint / CDN / CloudFront (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://start-with-cdn-or-cloud-front..." className="shad-input" {...field} />
                            </FormControl>
                            <FormMessage className="shad-form-message" />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4">
                    {defaultValues?.bucket && (
                        <Button type="button" variant="ghost" onClick={() => setIsEditMode(false)}>Cancel</Button>
                    )}
                    <Button type="submit" className="shad-submit-btn w-full md:w-auto px-8" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
