"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormTextInput, FormPasswordInput } from "@/components/form-inputs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";

import { s3ConfigService, type S3Config } from "@/features/private-s3/services/s3-config.service";

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
    const [currentConfig, setCurrentConfig] = useState<S3Config | null>(defaultValues as S3Config | null);
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
                    // CRITICAL SECURITY: We only store a flag that config exists.
                    // We NEVER store the actual secrets in the component state anymore.
                    setCurrentConfig({
                        bucket: latestConfig.bucket ? "EXISTING" : "",
                        region: "",
                        accessKeyId: "",
                        secretAccessKey: "",
                        cdnUrl: latestConfig.cdnUrl
                    } as any);

                    // If we somehow ended up in edit mode while configured, kick them out
                    // because we won't populate the form with real secrets anyway.
                    if (latestConfig.bucket && isEditMode) {
                        setIsEditMode(false);
                    }
                }
            } catch (error) {
                console.error("Failed to sync config flag:", error);
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
            // Get current config to preserve any fields not in the form (like cdnUrl)
            const existingConfig = await s3ConfigService.getConfig(userId);

            await s3ConfigService.saveConfig(userId, {
                ...(existingConfig || {}),
                ...values,
                cdnUrl: existingConfig?.cdnUrl,
            });

            // Update local state - only preserve the existence flag and cdnUrl
            setCurrentConfig({
                bucket: "EXISTING",
                cdnUrl: values.endpoint, // Or use the dedicated cdnUrl logic
            } as any);

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

    const [shareDuration, setShareDuration] = useState<number>(24);

    const handleShare = async () => {
        try {
            const encoded = await s3ConfigService.exportConfig(userId, shareDuration);
            if (encoded) {
                // Construct the full URL - we use window.location.pathname to keep it on the same page
                const shareUrl = `${window.location.origin}${window.location.pathname}?import=${encoded}`;
                await navigator.clipboard.writeText(shareUrl);
                toast({
                    className: "success-toast",
                    title: "Share Link Copied",
                    description: `Your private configuration link (expires in ${shareDuration}h) has been copied.`,
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                className: "error-toast",
                title: "Error",
                description: "Failed to generate share link.",
            });
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
    // Use cdnUrl if available, otherwise fall back to endpoint for backward compatibility
    const getInitialCdnUrl = () => {
        if (currentConfig?.cdnUrl !== undefined) return currentConfig.cdnUrl || "";
        // Backward compatibility: if endpoint exists and looks like a CloudFront URL, use it
        if (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://')) {
            return currentConfig.endpoint;
        }
        return "";
    };
    const [cdnUrl, setCdnUrl] = useState(getInitialCdnUrl());
    const [isSavingCdn, setIsSavingCdn] = useState(false);
    const [cdnError, setCdnError] = useState<string>("");

    // Sync CDN URL state when currentConfig changes
    useEffect(() => {
        const newCdnUrl = currentConfig?.cdnUrl !== undefined
            ? (currentConfig.cdnUrl || "")
            : (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://')
                ? currentConfig.endpoint
                : "");
        setCdnUrl(newCdnUrl);
    }, [currentConfig?.cdnUrl, currentConfig?.endpoint]);

    // Validate CDN URL format with better edge case handling
    const validateCdnUrl = (url: string): boolean => {
        if (!url || typeof url !== 'string' || url.trim() === "") {
            setCdnError("");
            return true; // Empty is valid (optional field)
        }

        const trimmed = url.trim();

        // Basic format check: must start with http:// or https://
        if (!trimmed.match(/^https?:\/\//i)) {
            setCdnError("URL must start with http:// or https://");
            return false;
        }

        try {
            const urlObj = new URL(trimmed);

            // Validate protocol
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                setCdnError("URL must use http:// or https:// protocol");
                return false;
            }

            // Validate hostname exists
            if (!urlObj.hostname || urlObj.hostname.trim() === '') {
                setCdnError("URL must have a valid hostname");
                return false;
            }

            setCdnError("");
            return true;
        } catch (e) {
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

    // Normalize URL: ensure it doesn't have trailing slash (we'll add it when constructing file URLs)
    const normalizeCdnUrl = (url: string): string => {
        if (!url || typeof url !== 'string') return '';
        let normalized = url.trim();
        // Remove trailing slashes - we'll add them when constructing file URLs
        normalized = normalized.replace(/\/+$/, '');
        return normalized;
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

            // Normalize and update ONLY the cdnUrl field, preserve all other current values exactly as they are
            // IMPORTANT: cdnUrl is for viewing files only, NOT for S3 API operations
            const normalizedUrl = cdnUrl.trim() ? normalizeCdnUrl(cdnUrl) : undefined;

            const updatedConfig = {
                ...latestConfig,
                cdnUrl: normalizedUrl, // Store normalized URL (without trailing slash)
                // Keep endpoint separate - it's for S3 API operations (e.g., MinIO), not for viewing
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

    // Get current cdnUrl value for comparison
    const currentCdnUrl = currentConfig?.cdnUrl ||
        (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://') ? currentConfig.endpoint : "") || "";

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
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex bg-light-300/50 p-1 rounded-full border border-light-300">
                            {[
                                { label: '1h', value: 1 },
                                { label: '24h', value: 24 },
                                { label: '7d', value: 168 }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setShareDuration(opt.value)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${shareDuration === opt.value
                                            ? 'bg-brand text-white shadow-sm'
                                            : 'text-light-100 hover:text-brand'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-brand/20 text-brand hover:bg-brand/5 hover:text-brand h-9 px-4 rounded-full"
                                onClick={handleShare}
                            >
                                Share
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red/20 text-red hover:bg-red/5 hover:text-red h-9 px-4 rounded-full"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="shad-form-item">
                        <label className="shad-form-label">Access Key ID</label>
                        <div className="shad-input cursor-not-allowed flex items-center px-4 h-[56px] rounded-full text-light-100">
                            ••••••••••••
                        </div>
                    </div>

                    <div className="shad-form-item">
                        <label className="shad-form-label">Secret Access Key</label>
                        <div className="shad-input cursor-not-allowed flex items-center px-4 h-[56px] rounded-full text-light-100">
                            ••••••••••••••••••••
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="shad-form-item">
                        <label className="shad-form-label">Bucket Name</label>
                        <div className="shad-input cursor-not-allowed flex items-center px-4 h-[56px] rounded-full text-light-100">
                            ••••••••••••
                        </div>
                    </div>

                    <div className="shad-form-item">
                        <label className="shad-form-label">Region</label>
                        <div className="shad-input cursor-not-allowed flex items-center px-4 h-[56px] rounded-full text-light-100">
                            ••••••••••••
                        </div>
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
                            disabled={isSavingCdn || cdnUrl === currentCdnUrl || !!cdnError}
                            className="shad-submit-btn"
                        >
                            {isSavingCdn ? "Saving..." : "Update"}
                        </Button>
                    </div>

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
                        showToggle={false}
                    />

                    <FormPasswordInput
                        control={form.control}
                        name="secretAccessKey"
                        label="Secret Access Key"
                        placeholder="wJalr..."
                        autoComplete="off"
                        showToggle={false}
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
                    label="CloudFront URL / CDN URL (Optional)"
                    placeholder="https://d1234567890.cloudfront.net"
                    description="CDN URL for directly accessing S3 files. For S3 API operations (MinIO, etc.), use a proper S3 endpoint."
                />

                <div className="flex justify-end gap-4">
                    {/* Cancel is only useful if we previously had a way to enter edit mode, which we removed.
                        Keeping it as a simple 'go back' if someone reset but didn't save. */}
                    {currentConfig?.bucket && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
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
