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
import { Lock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { testS3Connection, validateS3Config, type ConnectionStatus } from "@/lib/s3/validate";

const StorageModeToggle = () => {
  const { user } = useAuth();
  const { 
    mode, 
    setMode: setStorageModeStore, 
    s3Config, 
    setS3Config: setS3ConfigStore, 
    hasPlatformAccess, 
    setPlatformAccess,
    connectionStatus,
    connectionMessage,
    setConnectionStatus
  } = useStorageStore();
  const { isS3SettingsOpen, setS3SettingsOpen, isS3SetupGuideOpen, setS3SetupGuideOpen } = useUIStore();
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    bucket: '',
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
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
        // Check connection status if config exists
        if (mode === 'own-s3') {
          checkConnection(savedConfig);
        }
      }
    }
  }, [user?.id, setStorageModeStore, setS3ConfigStore, mode]);

  // Check connection when mode changes to own-s3
  useEffect(() => {
    if (mode === 'own-s3' && s3Config) {
      checkConnection(s3Config);
    } else if (mode === 'platform-s3') {
      setConnectionStatus('idle', '');
    }
  }, [mode, s3Config, setConnectionStatus]);

  const checkConnection = async (configToTest?: S3Config) => {
    const configToUse = configToTest || s3Config;
    if (!configToUse) {
      setConnectionStatus('disconnected', 'No configuration found');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('checking', 'Testing connection...');
    
    try {
      const result = await testS3Connection(configToUse);
      setConnectionStatus(result.status, result.message);
      
      if (result.status === 'connected') {
        toast({
          description: "Successfully connected to S3",
        });
      } else if (result.status === 'invalid') {
        toast({
          description: result.error || result.message,
          className: "error-toast",
        });
      }
    } catch (error: any) {
      setConnectionStatus('invalid', error.message || 'Connection test failed');
      toast({
        description: error.message || 'Failed to test connection',
        className: "error-toast",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

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

  const handleSaveConfig = async () => {
    // Validate config format first
    const formatValidation = validateS3Config(config);
    if (!formatValidation.valid) {
      toast({
        description: formatValidation.errors[0] || "Please fill in all required fields",
        className: "error-toast",
      });
      return;
    }

    // Validate with schema
    const validation = s3ConfigSchema.safeParse(config);
    if (!validation.success) {
      toast({
        description: validation.error.errors[0]?.message || "Please fill in all required fields",
        className: "error-toast",
      });
      return;
    }

    // Test connection before saving
    setIsTestingConnection(true);
    setConnectionStatus('checking', 'Testing connection...');
    
    try {
      const result = await testS3Connection(config);
      
      if (result.status === 'connected') {
        // Save config only if connection is successful
        if (user?.id) {
          setS3Config(config, user.id);
        } else {
          setS3Config(config); // Fallback without userId
        }
        setS3ConfigStore(config);
        setStorageMode('own-s3');
        setStorageModeStore('own-s3');
        setConnectionStatus('connected', result.message);
        setS3SettingsOpen(false);
        router.refresh();
        
        toast({
          description: "S3 configuration saved and connected successfully",
        });
      } else {
        // Show error but allow saving anyway (user might fix later)
        setConnectionStatus(result.status, result.message);
        toast({
          description: result.error || result.message || "Connection test failed. Configuration saved but not connected.",
          className: "error-toast",
        });
        
        // Still save the config (user might want to fix credentials later)
        if (user?.id) {
          setS3Config(config, user.id);
        } else {
          setS3Config(config);
        }
        setS3ConfigStore(config);
      }
    } catch (error: any) {
      setConnectionStatus('invalid', error.message || 'Connection test failed');
      toast({
        description: error.message || 'Failed to test connection',
        className: "error-toast",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleClearConfig = () => {
    clearS3Config();
    setS3ConfigStore(null);
    setConnectionStatus('idle', '');
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

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    if (mode !== 'own-s3') return '';
    
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Not Connected';
      case 'invalid':
        return 'Invalid';
      case 'checking':
        return 'Checking...';
      default:
        return 'Not Checked';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-light-300 bg-white p-1 shadow-drop-1">
        <Button
          type="button"
          onClick={() => handleModeChange('own-s3')}
          className={`button h-[40px] px-4 rounded-full transition-all relative ${
            mode === 'own-s3'
              ? 'bg-brand text-white shadow-drop-2 hover:bg-brand-100'
              : 'bg-transparent text-light-200 hover:bg-light-300 hover:text-light-100'
          }`}
        >
          Own S3
          {mode === 'own-s3' && s3Config && (
            <span className="absolute -top-1 -right-1">
              {getConnectionStatusIcon()}
            </span>
          )}
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

            {/* Connection Status Display */}
            {s3Config && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-light-300 bg-light-50">
                <div className="flex items-center gap-2 flex-1">
                  {getConnectionStatusIcon()}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-light-100">
                      {getConnectionStatusText()}
                    </span>
                    {connectionMessage && (
                      <span className="text-xs text-light-200">
                        {connectionMessage}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => checkConnection(config)}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="button h-[32px] px-3 text-xs"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveConfig} 
                disabled={isTestingConnection}
                className="flex-1 modal-submit-button"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Save & Test Connection'
                )}
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
