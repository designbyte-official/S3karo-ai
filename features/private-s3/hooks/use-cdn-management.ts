import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";

import { s3ConfigService, S3Config } from "../services/s3-config.service";

export const useCdnManagement = (userId: string, currentConfig: S3Config | null, onUpdate?: () => void) => {
    const { toast } = useToast();
    const router = useRouter();

    // Helper: Normalize URL (ensure it doesn't have trailing slash)
    const normalizeCdnUrl = (url: string): string => {
        if (!url || typeof url !== 'string') return '';
        let normalized = url.trim();
        normalized = normalized.replace(/\/+$/, '');
        return normalized;
    };

    // Helper: Initial CDN URL derivation
    const getInitialCdnUrl = () => {
        if (currentConfig?.cdnUrl !== undefined) return currentConfig.cdnUrl || "";
        if (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://')) {
            return currentConfig.endpoint;
        }
        return "";
    };

    const [cdnUrl, setCdnUrl] = useState(getInitialCdnUrl());
    const [isSavingCdn, setIsSavingCdn] = useState(false);
    const [cdnError, setCdnError] = useState<string>("");

    // Sync state when config changes externally
    useEffect(() => {
        const newCdnUrl = currentConfig?.cdnUrl !== undefined
            ? (currentConfig.cdnUrl || "")
            : (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://')
                ? currentConfig.endpoint
                : "");
        setCdnUrl(newCdnUrl);
    }, [currentConfig?.cdnUrl, currentConfig?.endpoint]);

    const validateCdnUrl = (url: string): boolean => {
        if (!url || typeof url !== 'string' || url.trim() === "") {
            setCdnError("");
            return true;
        }
        const trimmed = url.trim();
        if (!trimmed.match(/^https?:\/\//i)) {
            setCdnError("URL must start with http:// or https://");
            return false;
        }
        try {
            const urlObj = new URL(trimmed);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                setCdnError("URL must use http:// or https:// protocol");
                return false;
            }
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

    const handleCdnUpdate = async () => {
        if (cdnUrl.trim() !== "" && !validateCdnUrl(cdnUrl)) return;

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
            const latestConfig = await s3ConfigService.getConfig(userId);
            if (!latestConfig) throw new Error("No existing configuration found");

            const normalizedUrl = cdnUrl.trim() ? normalizeCdnUrl(cdnUrl) : undefined;
            const updatedConfig = {
                ...latestConfig,
                cdnUrl: normalizedUrl,
            };

            await s3ConfigService.saveConfig(userId, updatedConfig);
            toast({
                className: "success-toast",
                title: "CDN URL Updated",
                description: "Your CDN/CloudFront URL has been saved.",
            });

            window.dispatchEvent(new Event('s3-config-updated'));
            window.dispatchEvent(new Event('storage'));
            router.refresh();
            if (onUpdate) onUpdate();
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

    const currentCdnUrl = currentConfig?.cdnUrl ||
        (currentConfig?.endpoint && currentConfig.endpoint.startsWith('https://') ? currentConfig.endpoint : "") || "";

    return {
        cdnUrl,
        cdnError,
        isSavingCdn,
        currentCdnUrl,
        handleCdnUrlChange,
        handleCdnUpdate,
        validateCdnUrl
    };
};
