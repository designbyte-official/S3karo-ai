"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStorageMode, setStorageMode, getS3Config, setS3Config, clearS3Config, S3Config, type StorageMode } from "@/lib/s3/config";
import { useAuth } from "@/lib/hooks/use-auth";
import { useStorageStore } from "@/lib/stores/storage-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import S3SetupGuide from "@/components/S3SetupGuide";
import { s3ConfigSchema } from "@/lib/utils/validation";
import { Lock } from "lucide-react";

const StorageModeToggle = () => {
  const { user } = useAuth();
  const { mode, setMode: setStorageModeStore, s3Config, setS3Config: setS3ConfigStore, hasPlatformAccess, setPlatformAccess } = useStorageStore();
  const { isS3SettingsOpen, setS3SettingsOpen, isS3SetupGuideOpen, setS3SetupGuideOpen } = useUIStore();
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucket: '',
  });
  const { toast } = useToast();
  const router = useRouter();

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch('/api/subscriptions/check');
        if (response.ok) {
          const data = await response.json();
          setPlatformAccess(data.hasPlatformAccess || false);
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      }
    };

    checkSubscription();
  }, [user?.id, setPlatformAccess]);

  useEffect(() => {
    const currentMode = getStorageMode();
    setStorageModeStore(currentMode);
    
    if (user?.id) {
      const savedConfig = getS3Config(user.id);
      if (savedConfig) {
        setConfig(savedConfig);
        setS3ConfigStore(savedConfig);
      }
    }
  }, [user?.id, setStorageModeStore, setS3ConfigStore]);

  const handleModeChange = (newMode: StorageMode) => {
    // Check if platform-s3 requires subscription
    if (newMode === 'platform-s3' && !hasPlatformAccess) {
      toast({
        description: "Platform S3 requires an active subscription. Please upgrade your plan.",
        className: "error-toast",
      });
      return;
    }

    // Check if own-s3 needs configuration
    if (newMode === 'own-s3') {
      const savedConfig = user?.id ? getS3Config(user.id) : s3Config;
      if (!savedConfig || !savedConfig.accessKeyId || !savedConfig.secretAccessKey || !savedConfig.bucket) {
        setS3SettingsOpen(true);
        return;
      }
    }
    
    setStorageMode(newMode);
    setStorageModeStore(newMode);
    router.refresh();
    
    const modeLabels: Record<StorageMode, string> = {
      'own-s3': 'Your Own S3',
      'platform-s3': 'Platform S3'
    };
    
    toast({
      description: `Switched to ${modeLabels[newMode]}`,
    });
  };

  const handleSaveConfig = () => {
    // Validate config
    const validation = s3ConfigSchema.safeParse(config);
    if (!validation.success) {
      toast({
        description: validation.error.errors[0]?.message || "Please fill in all required fields",
        className: "error-toast",
      });
      return;
    }

    if (user?.id) {
      setS3Config(config, user.id);
    } else {
      setS3Config(config); // Fallback without userId
    }
    setS3ConfigStore(config);
    setStorageMode('own-s3');
    setStorageModeStore('own-s3');
    setS3SettingsOpen(false);
    router.refresh();
    
    toast({
      description: "S3 configuration saved successfully",
    });
  };

  const handleClearConfig = () => {
    clearS3Config();
    setS3ConfigStore(null);
    setStorageMode('own-s3');
    setStorageModeStore('own-s3');
    setConfig({
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: '',
    });
    setS3SettingsOpen(false);
    router.refresh();
    
    toast({
      description: "S3 configuration cleared",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-light-300 bg-white p-1 shadow-drop-1">
        <Button
          type="button"
          onClick={() => handleModeChange('own-s3')}
          className={`button h-[40px] px-4 rounded-full transition-all ${
            mode === 'own-s3'
              ? 'bg-brand text-white shadow-drop-2 hover:bg-brand-100'
              : 'bg-transparent text-light-200 hover:bg-light-300 hover:text-light-100'
          }`}
        >
          Own S3
        </Button>
        <Button
          type="button"
          onClick={() => handleModeChange('platform-s3')}
          disabled={!hasPlatformAccess}
          className={`button h-[40px] px-4 rounded-full transition-all relative ${
            mode === 'platform-s3'
              ? 'bg-brand text-white shadow-drop-2 hover:bg-brand-100'
              : hasPlatformAccess
              ? 'bg-transparent text-light-200 hover:bg-light-300 hover:text-light-100'
              : 'bg-transparent text-light-200 opacity-50 cursor-not-allowed'
          }`}
          title={!hasPlatformAccess ? "Requires active subscription" : "Platform S3"}
        >
          Platform S3
          {!hasPlatformAccess && (
            <Lock className="absolute -top-1 -right-1 w-3 h-3 text-light-200" />
          )}
        </Button>
      </div>

      <Dialog open={isS3SettingsOpen} onOpenChange={setS3SettingsOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="button h-[40px] px-4 rounded-full border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1"
            onClick={() => setS3SettingsOpen(true)}
          >
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="shad-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">
              Configure Your Own AWS S3 Storage
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="shad-form-item">
              <Label htmlFor="accessKeyId" className="shad-form-label">
                AWS Access Key ID
              </Label>
              <Input
                id="accessKeyId"
                type="text"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="shad-input"
              />
            </div>

            <div className="shad-form-item">
              <Label htmlFor="secretAccessKey" className="shad-form-label">
                AWS Secret Access Key
              </Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="shad-input"
              />
            </div>

            <div className="shad-form-item">
              <Label htmlFor="region" className="shad-form-label">
                AWS Region
              </Label>
              <Input
                id="region"
                type="text"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                placeholder="us-east-1"
                className="shad-input"
              />
            </div>

            <div className="shad-form-item">
              <Label htmlFor="bucket" className="shad-form-label">
                S3 Bucket Name
              </Label>
              <Input
                id="bucket"
                type="text"
                value={config.bucket}
                onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                placeholder="my-storage-bucket"
                className="shad-input"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} className="flex-1 modal-submit-button">
                Save Configuration
              </Button>
              {(user?.id ? getS3Config(user.id) : getS3Config()) && (
                <Button onClick={handleClearConfig} className="flex-1 modal-cancel-button">
                  Clear
                </Button>
              )}
            </div>

            <p className="caption text-center text-light-200">
              Your credentials are stored locally in your browser and never sent to our servers.
            </p>

            <Button
              type="button"
              onClick={() => {
                setS3SettingsOpen(false);
                setS3SetupGuideOpen(true);
              }}
              variant="outline"
              className="button h-[44px] w-full mt-2 rounded-full border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1"
            >
              View Setup Guide (CORS & IAM)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <S3SetupGuide
        isOpen={isS3SetupGuideOpen}
        onClose={() => setS3SetupGuideOpen(false)}
        bucketName={config.bucket}
      />
    </div>
  );
};

export default StorageModeToggle;
