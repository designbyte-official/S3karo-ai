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
import { getStorageMode, setStorageMode, getS3Config, setS3Config, clearS3Config, S3Config } from "@/lib/s3/config";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import S3SetupGuide from "@/components/S3SetupGuide";
import { s3ConfigSchema } from "@/lib/utils/validation";

const StorageModeToggle = () => {
  const [mode, setMode] = useState<'appwrite' | 's3'>('appwrite');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucket: '',
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.$id || user.id);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const currentMode = getStorageMode();
    setMode(currentMode);
    
    const savedConfig = getS3Config(userId);
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [userId]);

  const handleModeChange = (newMode: 'appwrite' | 's3') => {
    if (newMode === 's3') {
      const savedConfig = getS3Config(userId);
      if (!savedConfig || !savedConfig.accessKeyId || !savedConfig.secretAccessKey || !savedConfig.bucket) {
        setIsDialogOpen(true);
        return;
      }
    }
    
    setStorageMode(newMode);
    setMode(newMode);
    router.refresh();
    
    toast({
      description: `Switched to ${newMode.toUpperCase()} storage mode`,
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

    setS3Config(config, userId);
    setStorageMode('s3');
    setMode('s3');
    setIsDialogOpen(false);
    router.refresh();
    
    toast({
      description: "S3 configuration saved successfully",
    });
  };

  const handleClearConfig = () => {
    clearS3Config();
    setStorageMode('appwrite');
    setMode('appwrite');
    setConfig({
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: '',
    });
    setIsDialogOpen(false);
    router.refresh();
    
    toast({
      description: "S3 configuration cleared. Switched to Appwrite mode",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-light-400 bg-light-800 p-1">
        <Button
          type="button"
          onClick={() => handleModeChange('appwrite')}
          className={`text-xs ${
            mode === 'appwrite'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-light-300 hover:bg-light-700'
          }`}
        >
          Appwrite
        </Button>
        <Button
          type="button"
          onClick={() => handleModeChange('s3')}
          className={`text-xs ${
            mode === 's3'
              ? 'bg-primary-500 text-white'
              : 'bg-transparent text-light-300 hover:bg-light-700'
          }`}
        >
          S3
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="text-xs"
            onClick={() => setIsDialogOpen(true)}
          >
            Settings
          </Button>
        </DialogTrigger>
        <DialogContent className="shad-dialog">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">
              Configure AWS S3 Storage
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
              <Input
                id="accessKeyId"
                type="text"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
              <Input
                id="secretAccessKey"
                type="password"
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="region">AWS Region</Label>
              <Input
                id="region"
                type="text"
                value={config.region}
                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                placeholder="us-east-1"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bucket">S3 Bucket Name</Label>
              <Input
                id="bucket"
                type="text"
                value={config.bucket}
                onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                placeholder="my-storage-bucket"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfig} className="flex-1 modal-submit-button">
                Save Configuration
              </Button>
              {getS3Config() && (
                <Button onClick={handleClearConfig} className="flex-1 modal-cancel-button">
                  Clear
                </Button>
              )}
            </div>

            <p className="text-xs text-light-300">
              Your credentials are stored locally in your browser and never sent to our servers.
            </p>

            <Button
              type="button"
              onClick={() => {
                setIsDialogOpen(false);
                setShowSetupGuide(true);
              }}
              variant="outline"
              className="w-full mt-2 text-xs"
            >
              View Setup Guide (CORS & IAM)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <S3SetupGuide
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
        bucketName={config.bucket}
      />
    </div>
  );
};

export default StorageModeToggle;

