"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { toast } from "sonner";

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

interface SubscriptionData {
  id?: string;
  plan: string;
  status: string;
  storageLimit: number;
  storageUsed: number;
  bandwidthLimit: number;
  bandwidthUsed: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const useProfile = (isManagedStorage: boolean) => {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKeys = async () => {
    if (!isManagedStorage) return;
    try {
      const response = await fetch("/api/v1/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error: any) {
      toast.error("Failed to load API keys", { description: error.message });
    }
  };

  const fetchSubscription = async () => {
    if (!isManagedStorage) return;
    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      setSubscription(data);
    } catch (error: any) {
      toast.error("Failed to load subscription", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (isManagedStorage) {
        fetchKeys();
        fetchSubscription();
      } else {
        setLoading(false);
      }
    }
  }, [user, isManagedStorage]);

  return {
    keys,
    subscription,
    loading,
    refetchKeys: fetchKeys,
    refetchSubscription: fetchSubscription,
  };
};

