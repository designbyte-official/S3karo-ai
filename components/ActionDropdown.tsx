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
import { actionsDropdownItems } from "@/constants";
import Link from "next/link";
import { constructDownloadUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3CoreService } from "@/lib/services/s3/s3-core.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import { usePathname, useRouter } from "next/navigation";
import { FileDetails, ShareInput } from "@/components/ActionsModalContent";
import { File as S3File } from "@/types/file";
import { useAuthStore } from "@/lib/stores/auth-store";

const ActionDropdown = ({ file }: { file: S3File }) => {
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
  const user = useAuthStore((state) => state.user);

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
    const storageMode = s3ConfigService.getMode();

    try {
      // PRO CHECK for Managed Storage destructive/modifying operations
      if ((storageMode === 'managed-storage' || storageMode === 'platform-s3') && !user?.isPro) {
        if (["rename", "delete", "share"].includes(action.value)) {
          toast({
            description: `Managed Storage ${action.value} requires a Pro subscription.`,
            className: "error-toast",
          });
          setIsLoading(false);
          closeAllModals();
          return;
        }
      }

      if (action.value === "rename") {
        const nameParts = name.split('.');
        const extension = nameParts.length > 1 ? nameParts.pop() || '' : file.extension || '';
        const nameWithoutExt = nameParts.join('.');

        if (storageMode === 'own-s3') {
          const config = await s3ConfigService.getConfig(file.owner?.$id || file.accountId || '');
          if (!config) {
            toast({
              description: "Please configure your S3 credentials first",
              className: "error-toast",
            });
            return;
          }
          const pathParts = (file.bucketFileId || file.$id).split('/');
          pathParts[pathParts.length - 1] = `${nameWithoutExt}.${extension}`;
          const newKey = pathParts.join('/');

          const metadata = await s3CoreService.head(config, file.bucketFileId || file.$id);
          await s3CoreService.rename(config, file.bucketFileId || file.$id, newKey, metadata.metadata);
          success = true;
        } else if (storageMode === 'managed-storage' || storageMode === 'platform-s3') {
          await platformStorageService.renameFile({
            fileId: file.$id,
            name: nameWithoutExt,
            extension,
            path,
          });
          success = true;
        }
      } else if (action.value === "share") {
        if (storageMode === 'managed-storage' || storageMode === 'platform-s3') {
          await platformStorageService.shareFile({ fileId: file.$id, emails, path });
          success = true;
        }
      } else if (action.value === "delete") {
        if (storageMode === 'own-s3') {
          const config = await s3ConfigService.getConfig(file.owner?.$id || file.accountId || '');
          if (!config) {
            toast({
              description: "Please configure your S3 credentials first",
              className: "error-toast",
            });
            return;
          }
          await s3CoreService.delete(config, file.bucketFileId || file.$id);
          success = true;
        } else if (storageMode === 'managed-storage' || storageMode === 'platform-s3') {
          await platformStorageService.deleteFile({ fileId: file.$id, path });
          success = true;
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

    try {
      await platformStorageService.shareFile({
        fileId: file.$id,
        emails: updatedEmails,
        path,
      });
      setEmails(updatedEmails);
    } catch (error) {
      console.error('Remove user error:', error);
    }
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
          {actionsDropdownItems.map((actionItem) => {
            const storageMode = s3ConfigService.getMode();
            // Hide share option for Own S3 (no database)
            if (actionItem.value === "share" && storageMode === 'own-s3') {
              return null;
            }

            return (
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
                    href={downloadUrl || (file.bucketFileId ? constructDownloadUrl(file.bucketFileId) : "#")}
                    download={file.name}
                    className="flex items-center gap-2"
                    onClick={async (e) => {
                      const storageMode = s3ConfigService.getMode();
                      if (!downloadUrl) {
                        e.preventDefault();
                        try {
                          const ownerId = file.owner?.$id || file.accountId || '';
                          let url;
                          if (storageMode === 'own-s3') {
                            const config = await s3ConfigService.getConfig(ownerId);
                            if (!config) {
                              toast({
                                description: "Please configure your S3 credentials first",
                                className: "error-toast",
                              });
                              return;
                            }
                            url = await s3CoreService.getSignedUrl(config, file.bucketFileId || file.$id);
                          } else {
                            url = await platformStorageService.getDownloadUrl(file.bucketFileId || file.$id || file.key || '');
                          }
                          setDownloadUrl(url);
                          if (typeof window !== 'undefined') {
                            window.location.href = url;
                          }
                        } catch (error) {
                          console.error('Download error:', error);
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
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialogContent()}
    </Dialog>
  );
};
export default ActionDropdown;
