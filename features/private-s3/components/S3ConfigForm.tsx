"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormTextInput, FormPasswordInput } from "@/components/form-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// URL validation helper
const urlOrEmpty = z.union([
    z.string().url("Must be a valid URL (e.g., https://example.com)"),
    z.literal(""),
    z.undefined(),
]);

const formSchema = z.object({
    bucket: z.string().min(1, "Bucket name is required"),
    region: z.string().min(1, "Region is required"),
    accessKeyId: z.string().min(1, "Access Key ID is required"),
    secretAccessKey: z.string().min(1, "Secret Access Key is required"),
    endpoint: urlOrEmpty.optional(),
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
    const [currentConfig, setCurrentConfig] = useState<any>(defaultValues);
    const configSyncRef = useRef(false);

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

    // Sync form and state with latest config from localStorage
    useEffect(() => {
        const syncConfig = async () => {
            try {
                const latestConfig = await s3ConfigService.getConfig(userId);
                if (latestConfig) {
                    setCurrentConfig(latestConfig);
                    // Update form values if in edit mode
                    if (isEditMode) {
                        form.reset({
                            bucket: latestConfig.bucket || "",
                            region: latestConfig.region || "",
                            accessKeyId: latestConfig.accessKeyId || "",
                            secretAccessKey: latestConfig.secretAccessKey || "",
                            endpoint: latestConfig.endpoint || "",
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to sync config:", error);
            }
        };

        // Initial sync
        if (!configSyncRef.current) {
            syncConfig();
            configSyncRef.current = true;
        }

        // Listen for storage events (when config is updated elsewhere)
        const handleStorageChange = () => {
            syncConfig();
        };

        window.addEventListener('storage', handleStorageChange);
        // Also listen for custom storage events (same-tab updates)
        window.addEventListener('s3-config-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('s3-config-updated', handleStorageChange);
        };
    }, [userId, isEditMode, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            // Get current config to preserve any fields not in the form
            const existingConfig = await s3ConfigService.getConfig(userId) || {};
            
            await s3ConfigService.saveConfig(userId, {
                ...existingConfig,
                ...values,
                bucketName: values.bucket, // Ensure backward compatibility if needed
            });

            // Update local state
            const updatedConfig = await s3ConfigService.getConfig(userId);
            setCurrentConfig(updatedConfig);

            toast({
                className: "success-toast",
                title: "Configuration Saved",
                description: "Your S3 details have been securely stored locally.",
            });

            if (onConfigSaved) onConfigSaved();

            // Dispatch custom event for same-tab updates
            window.dispatchEvent(new Event('s3-config-updated'));
            window.dispatchEvent(new Event('storage'));
            
            setTimeout(() => {
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
            setCurrentConfig(null);
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
            window.dispatchEvent(new Event('s3-config-updated'));
            window.dispatchEvent(new Event('storage'));
            router.refresh();
        }
    };

    // Separate CDN URL handling - always allow editing
    const [cdnUrl, setCdnUrl] = useState(currentConfig?.endpoint || "");
    const [isSavingCdn, setIsSavingCdn] = useState(false);
    const [cdnError, setCdnError] = useState<string>("");

    // Sync CDN URL state when currentConfig changes
    useEffect(() => {
        if (currentConfig?.endpoint !== undefined) {
            setCdnUrl(currentConfig.endpoint || "");
        }
    }, [currentConfig?.endpoint]);

    // Validate CDN URL format
    const validateCdnUrl = (url: string): boolean => {
        if (!url || url.trim() === "") {
            setCdnError("");
            return true; // Empty is valid (optional field)
        }
        
        try {
            new URL(url);
            setCdnError("");
            return true;
        } catch {
            setCdnError("Must be a valid URL (e.g., https://example.com)");
            return false;
        }
    };

    const handleCdnUrlChange = (value: string) => {
        setCdnUrl(value);
        if (value.trim() !== "") {
            validateCdnUrl(value);
        } else {
            setCdnError("");
        }
    };

    const handleCdnUpdate = async () => {
        // Validate URL before saving
        if (cdnUrl.trim() !== "" && !validateCdnUrl(cdnUrl)) {
            return;
        }

        if (!currentConfig?.bucket) {
            toast({
                className: "error-toast",
                title: "Error",
                description: "Please configure S3 credentials first.",
            });
            return;
        }

        setIsSavingCdn(true);
        try {
            // CRITICAL: Fetch the CURRENT config from localStorage to avoid using stale values
            const latestConfig = await s3ConfigService.getConfig(userId);

            if (!latestConfig) {
                throw new Error("No existing configuration found");
            }

            // Update ONLY the endpoint field, preserve all other current values exactly as they are
            const updatedConfig = {
                ...latestConfig,
                endpoint: cdnUrl.trim() || undefined, // Store empty string as undefined for consistency
            };

            await s3ConfigService.saveConfig(userId, updatedConfig);

            // Update local state
            setCurrentConfig(updatedConfig);

            toast({
                className: "success-toast",
                title: "CDN URL Updated",
                description: "Your CDN/CloudFront URL has been saved.",
            });

            // Dispatch events for same-tab and cross-tab updates
            window.dispatchEvent(new Event('s3-config-updated'));
            window.dispatchEvent(new Event('storage'));
            
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                className: "error-toast",
                title: "Error",
                description: "Failed to update CDN URL.",
            });
        } finally {
            setIsSavingCdn(false);
        }
    };

    // Get current endpoint value for comparison
    const currentEndpoint = currentConfig?.endpoint || "";

    if (!isEditMode && currentConfig?.bucket) {
        return (
            <div className="space-y-6">
                {/* Status Banner */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">
                        ✓
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">S3 Configured & Ready</h3>
                        <p className="text-sm opacity-80">All credentials are securely stored locally</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-red/20 text-red hover:bg-red/5 hover:text-red"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            className="shad-submit-btn"
                            onClick={() => {
                                // Sync form with current config before entering edit mode
                                form.reset({
                                    bucket: currentConfig.bucket || "",
                                    region: currentConfig.region || "",
                                    accessKeyId: currentConfig.accessKeyId || "",
                                    secretAccessKey: currentConfig.secretAccessKey || "",
                                    endpoint: currentConfig.endpoint || "",
                                });
                                setIsEditMode(true);
                            }}
                        >
                            Edit
                        </Button>
                    </div>
                </div>

                {/* Readonly Credential Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="shad-form-item">
                        <label className="shad-form-label">Access Key ID</label>
                        <Input
                            value="••••••••••••"
                            disabled
                            className="shad-input bg-light-300 cursor-not-allowed"
                        />
                    </div>

                    <div className="shad-form-item">
                        <label className="shad-form-label">Secret Access Key</label>
                        <Input
                            value="••••••••••••••••••••"
                            disabled
                            className="shad-input bg-light-300 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="shad-form-item">
                        <label className="shad-form-label">Bucket Name</label>
                        <Input
                            value={currentConfig.bucket || ""}
                            disabled
                            className="shad-input bg-light-300 cursor-not-allowed"
                        />
                    </div>

                    <div className="shad-form-item">
                        <label className="shad-form-label">Region</label>
                        <Input
                            value={currentConfig.region || ""}
                            disabled
                            className="shad-input bg-light-300 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Always Editable CDN URL - Independent Update */}
                <div className="shad-form-item">
                    <label className="shad-form-label">Custom Endpoint / CDN / CloudFront (Optional)</label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                value={cdnUrl}
                                onChange={(e) => handleCdnUrlChange(e.target.value)}
                                onBlur={() => {
                                    // Validate on blur
                                    if (cdnUrl.trim() !== "") {
                                        validateCdnUrl(cdnUrl);
                                    }
                                }}
                                placeholder="https://assets.yourdomain.com/"
                                className={`shad-input flex-1 ${cdnError ? "border-red-500" : ""}`}
                            />
                            {cdnError && (
                                <p className="text-sm text-red-500 mt-1">{cdnError}</p>
                            )}
                        </div>
                        <Button
                            onClick={handleCdnUpdate}
                            disabled={isSavingCdn || cdnUrl === currentEndpoint || !!cdnError}
                            className="shad-submit-btn"
                        >
                            {isSavingCdn ? "Saving..." : "Update"}
                        </Button>
                    </div>
                    <p className="text-xs text-light-200 mt-1">
                        Update only affects the CDN URL. Other settings remain unchanged.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormPasswordInput
                        control={form.control}
                        name="accessKeyId"
                        label="Access Key ID"
                        placeholder="AKIA..."
                        autoComplete="off"
                    />

                    <FormPasswordInput
                        control={form.control}
                        name="secretAccessKey"
                        label="Secret Access Key"
                        placeholder="wJalr..."
                        autoComplete="off"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormTextInput
                        control={form.control}
                        name="bucket"
                        label="Bucket Name"
                        placeholder="my-app-bucket"
                    />

                    <FormTextInput
                        control={form.control}
                        name="region"
                        label="Region"
                        placeholder="us-east-1"
                    />
                </div>

                <FormTextInput
                    control={form.control}
                    name="endpoint"
                    label="Custom Endpoint / CDN / CloudFront (Optional)"
                    placeholder="https://start-with-cdn-or-cloud-front..."
                />

                <div className="flex justify-end gap-4">
                    {currentConfig?.bucket && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => {
                                // Reset form to current config values when canceling
                                form.reset({
                                    bucket: currentConfig.bucket || "",
                                    region: currentConfig.region || "",
                                    accessKeyId: currentConfig.accessKeyId || "",
                                    secretAccessKey: currentConfig.secretAccessKey || "",
                                    endpoint: currentConfig.endpoint || "",
                                });
                                setIsEditMode(false);
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" className="shad-submit-btn w-full md:w-auto px-8" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
