"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/auth-store";

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
    } catch (error: unknown) {
      console.error("fetchKeys error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load API keys", { description: message });
    }
  };

  const fetchSubscription = async () => {
    if (!isManagedStorage) return;
    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      setSubscription(data as SubscriptionData);
    } catch (error: unknown) {
      console.error("fetchSubscription error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load subscription", { description: message });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      if (isManagedStorage) {
        try {
          // Fetch both in parallel
          const keysPromise = fetchKeys();
          const subscriptionPromise = fetchSubscription();
          await Promise.all([keysPromise, subscriptionPromise]);
        } catch (error) {
          console.error("loadData background refresh failed:", error);
          // Individual errors are already handled in fetch functions with toasts
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isManagedStorage]);

  return {
    keys,
    subscription,
    loading,
    refetchKeys: fetchKeys,
    refetchSubscription: fetchSubscription,
  };
};
