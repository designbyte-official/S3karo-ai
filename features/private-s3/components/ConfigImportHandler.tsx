"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { s3ConfigService } from "../services/s3-config.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useToast } from "@/hooks/use-toast";

const ConfigImportContent = () => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [importData, setImportData] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [errorType, setErrorType] = useState<'expired' | 'invalid' | null>(null);

    useEffect(() => {
        const importParam = searchParams.get("import");
        if (importParam && user?.$id) {
            setImportData(importParam);
            setIsOpen(true);
            setErrorType(null); // Reset error state
        }
    }, [searchParams, user?.$id]);

    const handleConfirmImport = async () => {
        if (!importData || !user?.$id) return;

        setIsImporting(true);
        try {
            const result = await s3ConfigService.importConfig(user.$id, importData);
            if (result.success) {
                toast({
                    className: "success-toast",
                    title: "Configuration Imported",
                    description: "Your S3 details have been successfully updated.",
                });

                // Refresh the page logic
                window.dispatchEvent(new Event('s3-config-updated'));
                window.dispatchEvent(new Event('storage'));

                // Clear the URL parameter
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete("import");
                const cleanUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
                router.replace(cleanUrl);

                // Complete the refresh
                setTimeout(() => {
                    router.refresh();
                }, 100);
            } else {
                if (result.error === 'expired') {
                    setErrorType('expired');
                } else {
                    toast({
                        className: "error-toast",
                        title: "Import Failed",
                        description: "The shared configuration link is invalid or corrupted.",
                    });
                    setIsOpen(false);
                }
            }
        } catch (error) {
            console.error("Import error:", error);
            toast({
                className: "error-toast",
                title: "Error",
                description: "An unexpected error occurred during import.",
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        setImportData(null);
        // Clear the URL parameter
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("import");
        const cleanUrl = `${pathname}${newParams.toString() ? `?${newParams.toString()}` : ""}`;
        router.replace(cleanUrl);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleCancel();
        }}>
            <DialogContent className="shad-dialog max-w-[480px] p-10 rounded-[32px]">
                <DialogHeader className="space-y-4">
                    <DialogTitle className={`h2 text-center sm:text-left ${errorType === 'expired' ? 'text-red' : 'text-brand'}`}>
                        {errorType === 'expired' ? "Link Expired" : "Import Configuration"}
                    </DialogTitle>
                    <DialogDescription className="body-1 text-light-100 text-center sm:text-left">
                        {errorType === 'expired' ? (
                            "This configuration link has expired for security reasons. Please ask the sender to generate a new link."
                        ) : (
                            <>
                                A shared S3 configuration has been detected. Would you like to import it into your secure local vault? <br /><br />
                                <span className="text-red font-medium">Warning: This will replace your current S3 settings.</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="h-12 px-8 rounded-full text-light-100 hover:bg-light-300 font-semibold"
                    >
                        {errorType === 'expired' ? "Close" : "Dismiss"}
                    </Button>
                    {errorType !== 'expired' && (
                        <Button
                            onClick={handleConfirmImport}
                            disabled={isImporting}
                            className="h-12 px-10 rounded-full bg-brand text-white hover:bg-brand/90 shadow-drop-2 font-bold flex-1"
                        >
                            {isImporting ? "Importing Settings..." : "Confirm & Import"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const ConfigImportHandler = () => {
    return (
        <Suspense fallback={null}>
            <ConfigImportContent />
        </Suspense>
    );
};
