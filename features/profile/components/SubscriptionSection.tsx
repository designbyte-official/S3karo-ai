"use client";

import { Check, X, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes, formatPercentage } from "@/lib/utils/format";

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

interface SubscriptionSectionProps {
  subscription: SubscriptionData;
}

export const SubscriptionSection = ({ subscription }: SubscriptionSectionProps) => {
  const storagePercentage = (subscription.storageUsed / subscription.storageLimit) * 100;
  const bandwidthPercentage = (subscription.bandwidthUsed / subscription.bandwidthLimit) * 100;

  return (
    <div className="rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="h2 text-brand">Subscription</h2>
          <p className="body-2 mt-2 text-light-200">
            Manage your subscription and view usage statistics
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

      <div className="mb-4">
        <h3 className="h3 capitalize">{subscription.plan} Plan</h3>
        <p className="body-2 mt-1 text-light-200">
          Status: <span className="font-medium capitalize">{subscription.status}</span>
        </p>
        {subscription.currentPeriodEnd && (
          <p className="mt-2 text-sm text-light-200">
            {subscription.cancelAtPeriodEnd
              ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
          </p>
        )}
      </div>

      {/* Storage Usage */}
      <div className="mb-4">
        <h3 className="h4 mb-3">Storage Usage</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="body-2 text-light-200">Used</span>
            <span className="subtitle-2">
              {formatBytes(subscription.storageUsed)} / {formatBytes(subscription.storageLimit)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-light-300">
            <div
              className={`h-full transition-all ${
                storagePercentage > 90
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
      <div className="mb-4">
        <h3 className="h4 mb-3">Bandwidth Usage</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="body-2 text-light-200">Used</span>
            <span className="subtitle-2">
              {formatBytes(subscription.bandwidthUsed)} / {formatBytes(subscription.bandwidthLimit)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-light-300">
            <div
              className={`h-full transition-all ${
                bandwidthPercentage > 90
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
      <div>
        <h3 className="h4 mb-3">Plan Features</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
  );
};
