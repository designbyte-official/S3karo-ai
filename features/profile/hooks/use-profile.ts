import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/stores/auth-store";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  rateLimit: number;
  createdAt: string;
}

export interface SubscriptionData {
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

  const {
    data: keys = [],
    isLoading: isLoadingKeys,
    refetch: refetchKeys,
  } = useQuery<ApiKey[]>({
    queryKey: ["api-keys", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/v1/api-keys");
      if (!response.ok) throw new Error("Failed to fetch API keys");
      const data = await response.json();
      return data.keys || [];
    },
    enabled: !!user && isManagedStorage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: subscription = null,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription,
  } = useQuery<SubscriptionData | null>({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      return data as SubscriptionData;
    },
    enabled: !!user && isManagedStorage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loading = isManagedStorage && (isLoadingKeys || isLoadingSubscription);

  return {
    keys,
    subscription,
    loading,
    refetchKeys,
    refetchSubscription,
  };
};
