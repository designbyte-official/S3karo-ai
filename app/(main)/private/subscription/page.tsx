"use client";

import { useEffect, useState } from "react";

import { Check, X, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth-store";

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

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      if (!response.ok) throw new Error("Failed to fetch subscription");
      const data = await response.json();
      setSubscription(data as SubscriptionData);
    } catch (error: unknown) {
      console.error("fetchSubscription error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to load subscription", { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatPercentage = (used: number, limit: number) => {
    return ((used / limit) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">No subscription found</p>
      </div>
    );
  }

  const storagePercentage = (subscription.storageUsed / subscription.storageLimit) * 100;
  const bandwidthPercentage = (subscription.bandwidthUsed / subscription.bandwidthLimit) * 100;

  return (
    <div className="page-container">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="h1 text-brand">Subscription</h1>
          <p className="body-2 mt-2 text-light-200">
            Manage your subscription and view usage statistics
          </p>
        </div>

        {/* Plan Info */}
        <div className="mb-6 rounded-[18px] border border-light-300 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="h3 capitalize">{subscription.plan} Plan</h2>
              <p className="body-2 mt-1 text-light-200">
                Status: <span className="font-medium capitalize">{subscription.status}</span>
              </p>
            </div>
            {subscription.plan === "free" ? (
              <Button className="primary-btn">
                <TrendingUp className="mr-2 size-4" />
                Upgrade to Pro
              </Button>
            ) : (
              <Button variant="outline">Manage Subscription</Button>
            )}
          </div>

          {subscription.currentPeriodEnd && (
            <p className="text-sm text-light-200">
              {subscription.cancelAtPeriodEnd
                ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
          )}
        </div>

        {/* Storage Usage */}
        <div className="mb-6 rounded-[18px] border border-light-300 bg-white p-6">
          <h3 className="h4 mb-4">Storage Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="body-2 text-light-200">Used</span>
              <span className="subtitle-2">
                {formatBytes(subscription.storageUsed)} / {formatBytes(subscription.storageLimit)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-light-300">
              <div
                className={`h-full transition-all ${storagePercentage > 90
                    ? "bg-red"
                    : storagePercentage > 70
                      ? "bg-orange"
                      : "bg-brand"
                  }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-light-200">
                {formatPercentage(subscription.storageUsed, subscription.storageLimit)}% used
              </span>
              <span className="text-light-200">
                {formatBytes(subscription.storageLimit - subscription.storageUsed)} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Bandwidth Usage */}
        <div className="mb-6 rounded-[18px] border border-light-300 bg-white p-6">
          <h3 className="h4 mb-4">Bandwidth Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="body-2 text-light-200">Used</span>
              <span className="subtitle-2">
                {formatBytes(subscription.bandwidthUsed)} /{" "}
                {formatBytes(subscription.bandwidthLimit)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-light-300">
              <div
                className={`h-full transition-all ${bandwidthPercentage > 90
                    ? "bg-red"
                    : bandwidthPercentage > 70
                      ? "bg-orange"
                      : "bg-brand"
                  }`}
                style={{ width: `${Math.min(bandwidthPercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-light-200">
                {formatPercentage(subscription.bandwidthUsed, subscription.bandwidthLimit)}% used
              </span>
              <span className="text-light-200">
                {formatBytes(subscription.bandwidthLimit - subscription.bandwidthUsed)} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Plan Features */}
        <div className="rounded-[18px] border border-light-300 bg-white p-6">
          <h3 className="h4 mb-4">Plan Features</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green" />
              <span className="body-2">Managed Storage Access</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green" />
              <span className="body-2">API Access</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="size-5 text-green" />
              <span className="body-2">File Sharing</span>
            </div>
            <div className="flex items-center gap-3">
              {subscription.plan === "free" ? (
                <X className="size-5 text-light-200" />
              ) : (
                <Check className="size-5 text-green" />
              )}
              <span className="body-2">Priority Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
