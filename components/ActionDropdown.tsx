"use client";

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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Models } from "node-appwrite";
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  deleteFile as deleteFileAppwrite,
  renameFile as renameFileAppwrite,
  updateFileUsers,
} from "@/lib/actions/file.actions";
import {
  deleteFile as deleteFileClient,
  renameFile as renameFileClient,
  getDownloadUrl,
} from "@/lib/actions/file.actions.client";
import { getStorageMode } from "@/lib/s3/config";
import { usePathname, useRouter } from "next/navigation";
import { FileDetails, ShareInput } from "@/components/ActionsModalContent";

const ActionDropdown = ({ file }: { file: Models.Document }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const router = useRouter();
  const path = usePathname();
  const { toast } = useToast();

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
    setName(file.name);
    //   setEmails([]);
  };

  const handleAction = async () => {
    if (!action) return;
    setIsLoading(true);
    let success = false;
    const storageMode = getStorageMode();

    try {
      if (action.value === "rename") {
        if (storageMode === 's3') {
          // Extract name and extension
          const nameParts = name.split('.');
          const extension = nameParts.length > 1 ? nameParts.pop() || '' : file.extension || '';
          const nameWithoutExt = nameParts.join('.');
          const ownerId = (file as any).owner || (file as any).accountId || '';
          success = await renameFileClient({
            fileId: file.$id,
            name: nameWithoutExt,
            extension,
            path,
            ownerId,
            bucketFileId: file.bucketFileId,
          });
        } else {
          const nameParts = name.split('.');
          const extension = nameParts.length > 1 ? nameParts.pop() || '' : file.extension || '';
          const nameWithoutExt = nameParts.join('.');
          success = await renameFileAppwrite({
            fileId: file.$id,
            name: nameWithoutExt,
            extension: extension || file.extension,
            path,
          });
        }
      } else if (action.value === "share") {
        // Share functionality only works with Appwrite for now
        if (storageMode === 'appwrite') {
          success = await updateFileUsers({ fileId: file.$id, emails, path });
        } else {
          // S3 doesn't support sharing in the same way
          toast({
            description: "File sharing is only available in Appwrite mode",
            className: "error-toast",
          });
        }
      } else if (action.value === "delete") {
        if (storageMode === 's3') {
          success = await deleteFileClient({
            fileId: file.$id,
            bucketFileId: file.bucketFileId,
            path,
          });
        } else {
          success = await deleteFileAppwrite({
            fileId: file.$id,
            bucketFileId: file.bucketFileId,
            path,
          });
        }
      }

      if (success) {
        closeAllModals();
        router.refresh();
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    const updatedEmails = emails.filter((e) => e !== email);

    const success = await updateFileUsers({
      fileId: file.$id,
      emails: updatedEmails,
      path,
    });

    if (success) setEmails(updatedEmails);
    closeAllModals();
  };

  const renderDialogContent = () => {
    if (!action) return null;

    const { value, label } = action;

    return (
      <DialogContent className="shad-dialog button">
        <DialogHeader className="flex flex-col gap-3">
          <DialogTitle className="text-center text-light-100">
            {label}
          </DialogTitle>
          {value === "rename" && (
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {value === "details" && <FileDetails file={file} />}
          {value === "share" && (
            <ShareInput
              file={file}
              onInputChange={setEmails}
              onRemove={handleRemoveUser}
            />
          )}
          {value === "delete" && (
            <p className="delete-confirmation">
              Are you sure you want to delete{` `}
              <span className="delete-file-name">{file.name}</span>?
            </p>
          )}
        </DialogHeader>
        {["rename", "delete", "share"].includes(value) && (
          <DialogFooter className="flex flex-col gap-3 md:flex-row">
            <Button onClick={closeAllModals} className="modal-cancel-button">
              Cancel
            </Button>
            <Button onClick={handleAction} className="modal-submit-button">
              <p className="capitalize">{value}</p>
              {isLoading && (
                <Image
                  src="/assets/icons/loader.svg"
                  alt="loader"
                  width={24}
                  height={24}
                  className="animate-spin"
                />
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    );
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
          {actionsDropdownItems.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);

                if (
                  ["rename", "share", "delete", "details"].includes(
                    actionItem.value,
                  )
                ) {
                  setIsModalOpen(true);
                }
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={downloadUrl || constructDownloadUrl(file.bucketFileId)}
                  download={file.name}
                  className="flex items-center gap-2"
                  onClick={async (e) => {
                    const storageMode = getStorageMode();
                    if (storageMode === 's3' && !downloadUrl) {
                      e.preventDefault();
                      try {
                        const url = await getDownloadUrl(file.bucketFileId);
                        setDownloadUrl(url);
                        // Trigger download
                        if (typeof window !== 'undefined') {
                          window.location.href = url;
                        }
                      } catch (error) {
                        console.error('Download error:', error);
                        toast({
                          description: "Failed to generate download URL",
                          className: "error-toast",
                        });
                      }
                    }
                  }}
                >
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image
                    src={actionItem.icon}
                    alt={actionItem.label}
                    width={30}
                    height={30}
                  />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};
export default ActionDropdown;
