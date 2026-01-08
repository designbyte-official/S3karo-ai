"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { S3File } from "@/types/file";
import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { actionsDropdownItems } from "@/features/shared/constants";
import { ActionsModalContent } from "./ActionsModalContent";
import { useFileActions } from "@/features/shared/hooks/use-file-actions";

const ActionDropdown = ({ file }: { file: S3File }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState<any | null>(null);
    const [name, setName] = useState(file.name);
    const [emails, setEmails] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const user = useAuthStore((state: any) => state.user);
    const path = usePathname();

    const {
        isLoading,
        isPrivateS3,
        handleRename,
        handleDelete,
        handleDownload,
        handleShare
    } = useFileActions(file, user);

    const closeAllModals = () => {
        setIsModalOpen(false);
        setAction(null);
        setName(file.name);
    };

    const onExecuteAction = async () => {
        if (!action) return;
        if (action.value === "rename") await handleRename(name, closeAllModals);
        if (action.value === "delete") await handleDelete(closeAllModals);
        if (action.value === "share") await handleShare(emails, closeAllModals);
    };

    const handleRemoveUser = async (email: string) => {
        const updatedEmails = emails.filter((e) => e !== email);
        await handleShare(updatedEmails, () => setEmails(updatedEmails));
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger className="shad-no-focus">
                    <Image
                        src="/assets/icons/dots.svg"
                        alt="dots"
                        width={34}
                        height={34}
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel className="max-w-[200px] truncate">
                        {file.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {actionsDropdownItems.map((actionItem) => {
                        // Hide share option for Own S3 (no database)
                        if (actionItem.value === "share" && isPrivateS3) {
                            return null;
                        }

                        return (
                            <DropdownMenuItem
                                key={actionItem.value}
                                className="shad-dropdown-item"
                                onClick={() => {
                                    if (actionItem.value === "download") {
                                        handleDownload();
                                        return;
                                    }
                                    setAction(actionItem);
                                    setIsModalOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Image
                                        src={actionItem.icon}
                                        alt={actionItem.label}
                                        width={30}
                                        height={30}
                                    />
                                    {actionItem.label}
                                </div>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            {action && (
                <DialogContent className="shad-dialog">
                    <DialogHeader className="flex flex-col gap-3">
                        <DialogTitle className="text-center sm:text-left">{action.label}</DialogTitle>
                        {action.value === "rename" && (
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="shad-input"
                                onKeyDown={(e) => e.key === 'Enter' && onExecuteAction()}
                            />
                        )}
                        {action.value === "details" && <ActionsModalContent.FileDetails file={file} />}
                        {action.value === "share" && (
                            <ActionsModalContent.ShareInput
                                file={file}
                                onInputChange={setEmails}
                                onRemove={handleRemoveUser}
                            />
                        )}
                        {action.value === "delete" && (
                            <p className="delete-confirmation">
                                Are you sure you want to delete{` `}
                                <span className="delete-file-name">{file.name}</span>?
                            </p>
                        )}
                    </DialogHeader>

                    {["rename", "delete", "share"].includes(action.value) && (
                        <DialogFooter className="flex flex-col gap-3 md:flex-row">
                            <Button onClick={closeAllModals} className="modal-cancel-btn" disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={onExecuteAction}
                                className="shad-submit-btn"
                                disabled={isLoading}
                            >
                                <p className="capitalize">{action.value}</p>
                                {isLoading && (
                                    <Image
                                        src="/assets/icons/loader.svg"
                                        alt="loader"
                                        width={24}
                                        height={24}
                                        className="animate-spin ml-2"
                                    />
                                )}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            )}
        </Dialog>
    );
};
export default ActionDropdown;
