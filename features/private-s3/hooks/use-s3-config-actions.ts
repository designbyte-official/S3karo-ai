import { useState } from "react";

import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";

import { s3ConfigService } from "../services/s3-config.service";

export const useS3ConfigActions = (userId: string) => {
    const [shareDuration, setShareDuration] = useState(24);
    const { toast } = useToast();
    const router = useRouter();

    const handleShare = async () => {
        try {
            const encoded = await s3ConfigService.exportConfig(userId, shareDuration);
            if (encoded) {
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

    const handleReset = async (onSuccess: () => void) => {
        if (confirm("Are you sure you want to remove your S3 configuration? This will clear the details from your browser.")) {
            await s3ConfigService.clearConfig(userId);
            onSuccess();
            toast({
                title: "Configuration Reset",
                description: "Local configuration has been cleared.",
            });
            window.dispatchEvent(new Event('s3-config-updated'));
            window.dispatchEvent(new Event('storage'));
            router.refresh();
        }
    };

    return {
        shareDuration,
        setShareDuration,
        handleShare,
        handleReset
    };
};
