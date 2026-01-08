"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Copy, Eye, EyeOff, Plus } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  rateLimit: number;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  const fetchKeys = async () => {
    try {
      const response = await fetch("/api/v1/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error: any) {
      toast.error("Failed to load API keys", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchKeys();
    }
  }, [user]);

  const createKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    try {
      const response = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create API key");
      }

      const data = await response.json();
      setNewKeyValue(data.key);
      setShowNewKey(true);
      setNewKeyName("");
      fetchKeys();
      toast.success("API key created successfully");
    } catch (error: any) {
      toast.error("Failed to create API key", { description: error.message });
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete API key");

      toast.success("API key deleted successfully");
      fetchKeys();
    } catch (error: any) {
      toast.error("Failed to delete API key", { description: error.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="h1 text-brand">API Keys</h1>
            <p className="body-2 text-light-200 mt-2">
              Manage API keys for programmatic access to your files
            </p>
          </div>
          <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="primary-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {newKeyValue && showNewKey ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        ⚠️ Save this key now! You won't be able to see it again.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                          {newKeyValue}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(newKeyValue)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setNewKeyValue(null);
                        setShowNewKey(false);
                        setNewKeyDialogOpen(false);
                      }}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Key Name
                      </label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production API Key"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={createKey}
                        disabled={!newKeyName.trim()}
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setNewKeyDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {keys.length === 0 ? (
          <div className="text-center py-12">
            <p className="body-2 text-light-200 mb-4">No API keys yet</p>
            <p className="caption text-light-200">
              Create your first API key to start using the S3-Karo API
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-6 bg-white rounded-[18px] shadow-sm border border-light-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="h4">{key.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          key.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {key.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-light-200">
                      <p>
                        <strong>Prefix:</strong> {key.prefix}...
                      </p>
                      <p>
                        <strong>Rate Limit:</strong> {key.rateLimit} requests/hour
                      </p>
                      <p>
                        <strong>Last Used:</strong> {formatDate(key.lastUsedAt)}
                      </p>
                      {key.expiresAt && (
                        <p>
                          <strong>Expires:</strong> {formatDate(key.expiresAt)}
                        </p>
                      )}
                      <p>
                        <strong>Created:</strong> {formatDate(key.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteKey(key.id)}
                    className="text-red hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-6 bg-light-300 rounded-[18px]">
          <h3 className="h4 mb-3">API Documentation</h3>
          <p className="body-2 text-light-200 mb-4">
            Learn how to use your API keys to integrate S3-Karo into your applications.
          </p>
          <a
            href="/docs/API.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline font-medium"
          >
            View API Documentation →
          </a>
        </div>
      </div>
    </div>
  );
}

