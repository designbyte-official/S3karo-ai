import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormTextInput, FormPasswordInput } from "@/components/form-inputs";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { useToast } from "@/hooks/use-toast";

import { useCdnManagement } from "../hooks/use-cdn-management";
import { useS3ConfigActions } from "../hooks/use-s3-config-actions";
import { useS3ConfigSync } from "../hooks/use-s3-config-sync";

import { MaskedField } from "./MaskedField";

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
  const { currentConfig, setCurrentConfig, isEditMode, setIsEditMode } = useS3ConfigSync(
    userId,
    !defaultValues?.bucket
  );

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
      window.dispatchEvent(new Event("s3-config-updated"));
      window.dispatchEvent(new Event("storage"));

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

  const { shareDuration, setShareDuration, handleShare, handleReset } = useS3ConfigActions(userId);

  const onReset = () => {
    setCurrentConfig(null);
    form.reset({
      bucket: "",
      region: "",
      accessKeyId: "",
      secretAccessKey: "",
      endpoint: "",
    });
    setIsEditMode(true);
  };

  const {
    cdnUrl,
    cdnError,
    isSavingCdn,
    currentCdnUrl,
    handleCdnUrlChange,
    handleCdnUpdate,
    validateCdnUrl,
  } = useCdnManagement(userId, currentConfig, () => router.refresh());

  const ExpirationSelector = () => (
    <div className="flex rounded-full border border-light-300 bg-light-300/50 p-1">
      {[
        { label: "1h", value: 1 },
        { label: "24h", value: 24 },
        { label: "7d", value: 168 },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => setShareDuration(opt.value)}
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
            shareDuration === opt.value ? "bg-brand text-white" : "text-light-100 hover:text-brand"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  if (!isEditMode && currentConfig?.bucket) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-light-300/20 bg-light-400/5 p-6 md:flex-row">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">S3 Configured</h3>
            <p className="text-sm text-light-100">Your credentials are stored locally</p>
          </div>

          <div className="flex items-center gap-3">
            <ExpirationSelector />
            <Button variant="outline" size="sm" onClick={handleShare}>
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red hover:text-red"
              onClick={() => handleReset(onReset)}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MaskedField label="Access Key ID" />
          <MaskedField label="Secret Access Key" value="••••••••••••••••••••" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MaskedField label="Bucket Name" />
          <MaskedField label="Region" />
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
              {cdnError && <p className="text-red-500 mt-1 text-sm">{cdnError}</p>}
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          <Button
            type="submit"
            className="shad-submit-btn w-full px-8 md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
