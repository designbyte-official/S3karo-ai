import React, { useState, useEffect, useRef } from "react";

import { FolderPlus, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface NewFolderDialogProps {
    onCreate: (name: string) => Promise<void>;
}

export const NewFolderDialog = ({ onCreate }: NewFolderDialogProps) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Focus input when dialog opens
    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [open]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            setName("");
            setLoading(false);
            setError("");
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError("Folder name is required");
            return;
        }

        if (trimmedName.includes("/") || trimmedName.includes("\\")) {
            setError("Folder name cannot contain slashes");
            return;
        }

        if (trimmedName.length > 255) {
            setError("Folder name is too long (max 255 characters)");
            return;
        }

        setError("");
        setLoading(true);
        try {
            await onCreate(trimmedName);
            toast({
                title: "Folder Created",
                description: `"${trimmedName}" has been created successfully.`,
                className: "success-toast",
            });
            setOpen(false);
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to create folder. Please try again.";
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shad-button-primary h-[52px] gap-2 rounded-full bg-dark-100 px-6 text-white shadow-drop-1 transition-all hover:bg-dark-200">
                    <FolderPlus size={20} />
                    <span className="hidden font-medium sm:block">New Folder</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="shad-dialog">
                <DialogHeader className="flex flex-col gap-3">
                    <DialogTitle className="text-center sm:text-left">Create New Folder</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="Folder Name"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError("");
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") handleClose();
                            }}
                            className="shad-input"
                            disabled={loading}
                            aria-invalid={!!error}
                            aria-describedby={error ? "folder-name-error" : undefined}
                        />
                        {error && (
                            <p id="folder-name-error" className="flex items-center gap-1 px-1 text-sm text-red">
                                <AlertCircle className="size-4" />
                                {error}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="flex flex-col gap-3 md:flex-row">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={loading}
                            className="modal-cancel-btn"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="shad-submit-btn"
                        >
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
