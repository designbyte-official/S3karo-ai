"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { s3ConfigService, S3Config, StorageMode, ConnectionStatus } from "@/lib/services/s3/s3-config.service";
import { useAuth } from "@/lib/hooks/use-auth";
import { useStorageStore } from "@/lib/stores/storage-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import S3SetupGuide from "@/components/S3SetupGuide";
import { s3ConfigSchema } from "@/lib/utils/validation";
import { Lock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

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
    cdnUrl: '',
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
    const loadConfig = async () => {
      const currentMode = s3ConfigService.getMode();
      setStorageModeStore(currentMode);

      if (user?.id) {
        const savedConfig = await s3ConfigService.getConfig(user.id);
        if (savedConfig) {
          setConfig(savedConfig);
          setS3ConfigStore(savedConfig);
          // Check connection status if config exists
          if (mode === 'own-s3') {
            checkConnection(savedConfig);
          }
        } else {
          // Reset config if no saved config
          setConfig({
            accessKeyId: '',
            secretAccessKey: '',
            region: 'us-east-1',
            bucket: '',
            cdnUrl: '',
          });
        }
      }
    };
    loadConfig();
  }, [user?.id, setStorageModeStore, setS3ConfigStore, mode]);

  // Load config when settings dialog opens
  useEffect(() => {
    const loadConfig = async () => {
      if (isS3SettingsOpen && user?.id) {
        const savedConfig = await s3ConfigService.getConfig(user.id);
        if (savedConfig) {
          setConfig(savedConfig);
        } else {
          // Reset config if no saved config
          setConfig({
            accessKeyId: '',
            secretAccessKey: '',
            region: 'us-east-1',
            bucket: '',
            cdnUrl: '',
          });
        }
        // Reset connection status when dialog opens
        setConnectionStatus('idle', '');
      }
    };
    loadConfig();
  }, [isS3SettingsOpen, user?.id, setConnectionStatus]);

  // Check connection when mode changes to own-s3
  useEffect(() => {
    if (mode === 'own-s3' && s3Config) {
      checkConnection(s3Config);
    } else if (mode === 'managed-storage') {
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
      const result = await s3ConfigService.testConnection(configToUse);
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

  const handleModeChange = async (newMode: StorageMode) => {
    // Rebrand platform-s3 to managed-storage
    const targetMode = newMode;

    // If clicking the same mode, open settings or show status
    if (targetMode === mode) {
      if (targetMode === 'own-s3') {
        const savedConfig = user?.id ? await s3ConfigService.getConfig(user.id) : s3Config;
        if (savedConfig && savedConfig.accessKeyId && savedConfig.secretAccessKey && savedConfig.bucket) {
          // If config exists, test connection
          checkConnection(savedConfig);
          toast({
            description: "Testing S3 connection...",
          });
        } else {
          // If no config, open settings
          setS3SettingsOpen(true);
        }
      }
      return;
    }

    // ALLOW switching even if not pro, actions are gated elsewhere

    // Check if own-s3 needs configuration
    if (targetMode === 'own-s3') {
      const savedConfig = user?.id ? await s3ConfigService.getConfig(user.id) : s3Config;
      if (!savedConfig || !savedConfig.accessKeyId || !savedConfig.secretAccessKey || !savedConfig.bucket) {
        // Open settings dialog to configure
        setS3SettingsOpen(true);
        toast({
          description: "Please configure your S3 credentials first",
          className: "error-toast",
        });
        return;
      }

      // Config exists, switch mode and test connection
      s3ConfigService.setMode(targetMode);
      setStorageModeStore(targetMode);
      router.refresh();

      // Test connection after switching
      setTimeout(() => {
        checkConnection(savedConfig);
      }, 100);

      toast({
        description: "Switched to Your Own S3. Testing connection...",
      });
      return;
    }

    // For managed-storage
    s3ConfigService.setMode(targetMode);
    setStorageModeStore(targetMode);
    router.refresh();

    if (!hasPlatformAccess) {
      toast({
        description: "Viewing Managed Storage (Action required Pro subscription)",
      });
    } else {
      toast({
        description: `Switched to Managed Storage`,
      });
    }
  };

  const handleSaveConfig = async () => {
    // Validate config format first
    const formatValidation = s3ConfigService.validateConfig(config);
    if (!formatValidation.valid) {
      toast({
        description: formatValidation.errors[0] || "Please fill in all required fields",
        className: "error-toast",
      });
      return;
    }

    // Test connection before saving
    setIsTestingConnection(true);
    setConnectionStatus('checking', 'Testing connection...');

    try {
      const result = await s3ConfigService.testConnection(config);

      if (result.status === 'connected') {
        // Save config only if connection is successful
        await s3ConfigService.saveConfig(config, user?.id);

        setS3ConfigStore(config);
        s3ConfigService.setMode('own-s3');
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
        await s3ConfigService.saveConfig(config, user?.id);
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
    s3ConfigService.clear();
    setS3ConfigStore(null);
    setConnectionStatus('idle', '');
    s3ConfigService.setMode('own-s3');
    setStorageModeStore('own-s3');
    setConfig({
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: '',
      cdnUrl: '',
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
        return <CheckCircle2 className="w-5 h-5 text-green" />;
      case 'disconnected':
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red" />;
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-light-200" />;
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
          className={`button h-[40px] px-4 rounded-full transition-all relative ${mode === 'own-s3'
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
          onClick={() => handleModeChange('managed-storage')}
          className={`button h-[40px] px-4 rounded-full transition-all relative ${mode === 'managed-storage'
            ? 'bg-brand text-white shadow-drop-2 hover:bg-brand-100'
            : 'bg-transparent text-light-200 hover:bg-light-300 hover:text-light-100'
            }`}
          title={!hasPlatformAccess ? "Actions require Pro subscription" : "Managed Storage"}
        >
          Managed Storage
          {!hasPlatformAccess && (
            <Lock className="absolute -top-1 -right-1 w-3 h-3 text-light-200" />
          )}
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        className="button h-[40px] px-4 rounded-full border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1"
        onClick={() => setS3SettingsOpen(true)}
      >
        Settings
      </Button>

      <ScrollableDialog
        open={isS3SettingsOpen}
        onOpenChange={setS3SettingsOpen}
        title={s3Config ? 'Edit AWS S3 Configuration' : 'Configure Your Own AWS S3 Storage'}
        maxWidth="lg"
        className="lg:min-w-[500px]"
        footer={
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSaveConfig}
              disabled={isTestingConnection || !config.accessKeyId || !config.secretAccessKey || !config.bucket}
              className="w-full primary-btn shadow-drop-2 h-[44px]"
              title={!config.accessKeyId || !config.secretAccessKey || !config.bucket ? "Fill in all fields to save" : s3Config ? "Update and test connection" : "Save and test connection"}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : s3Config ? (
                'Update Configuration'
              ) : (
                'Save Configuration'
              )}
            </Button>

            <Button
              onClick={() => checkConnection(config)}
              disabled={isTestingConnection || !config.accessKeyId || !config.secretAccessKey || !config.bucket}
              variant="outline"
              className="w-full button border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1 h-[40px]"
              title={!config.accessKeyId || !config.secretAccessKey || !config.bucket ? "Fill in all fields to test" : "Test connection without saving"}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection (Don\'t Save)'
              )}
            </Button>

            {/* Delete/Clear Button */}
            {s3Config && (
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your S3 configuration? This will clear all saved credentials.')) {
                    handleClearConfig();
                  }
                }}
                variant="outline"
                className="w-full button border border-red/30 bg-red/10 text-red hover:bg-red/20 hover:text-red shadow-drop-1 h-[40px]"
                title="Delete saved S3 credentials"
              >
                Delete Configuration
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Input Fields */}
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

            <div className="shad-form-item">
              <Label htmlFor="cdnUrl" className="shad-form-label">
                CDN URL (Optional)
              </Label>
              <Input
                id="cdnUrl"
                type="text"
                value={config.cdnUrl || ''}
                onChange={(e) => setConfig({ ...config, cdnUrl: e.target.value })}
                placeholder="https://cdn.example.com"
                className="shad-input"
              />
              <p className="caption text-light-200 mt-1">
                If you have a CDN configured, enter the base URL here. Files will be served from CDN instead of S3.
              </p>
            </div>
          </div>

          {/* Connection Status Display - Only show after testing */}
          {connectionStatus !== 'idle' && (
            <div className="flex items-center gap-3 p-4 rounded-lg border border-light-300 bg-white shadow-drop-1">
              <div className="flex items-center gap-3 flex-1">
                {getConnectionStatusIcon()}
                <div className="flex flex-col">
                  <span className="body-2 font-semibold text-light-100">
                    {getConnectionStatusText()}
                  </span>
                  {connectionMessage && (
                    <span className="caption text-light-200 mt-1">
                      {connectionMessage}
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => checkConnection(config)}
                disabled={isTestingConnection || !config.accessKeyId || !config.secretAccessKey || !config.bucket}
                variant="outline"
                className="button h-[36px] px-4 body-2 border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1"
                title={!config.accessKeyId || !config.secretAccessKey || !config.bucket ? "Fill in all fields to test" : "Test S3 connection"}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Now'
                )}
              </Button>
            </div>
          )}

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
            className="w-full button border border-light-300 bg-white text-light-100 hover:bg-light-300 shadow-drop-1 h-[40px]"
          >
            View Setup Guide (CORS & IAM)
          </Button>
        </div>
      </ScrollableDialog>

      <S3SetupGuide
        isOpen={isS3SetupGuideOpen}
        onClose={() => setS3SetupGuideOpen(false)}
        bucketName={config.bucket}
      />
    </div>
  );
};

export default StorageModeToggle;
