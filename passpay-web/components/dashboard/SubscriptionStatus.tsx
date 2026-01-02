"use client";

import { useWallet } from "@lazorkit/wallet";
import { useEffect, useState } from "react";
import { getActiveSubscription, getDaysRemaining } from "@/lib/services";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Displays current subscription status
 * Shows plan, days remaining, and subscribe/renew button
 */
export function SubscriptionStatus() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [subscription, setSubscription] =
    useState<ReturnType<typeof getActiveSubscription>>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    if (!isConnected || !smartWalletPubkey) {
      setSubscription(null);
      setDaysRemaining(0);
      return;
    }

    const wallet = smartWalletPubkey.toBase58();
    const sub = getActiveSubscription(wallet);
    const days = getDaysRemaining(wallet);

    setSubscription(sub);
    setDaysRemaining(days);
  }, [isConnected, smartWalletPubkey]);

  if (!isConnected) {
    return null;
  }

  if (!subscription) {
    return (
      <Card className="border-[#8f8f8f]/30 bg-[#1a1a1a]">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">
                No Active Subscription
              </h3>
              <p className="text-sm text-[#8f8f8f]">
                Subscribe to access premium content
              </p>
            </div>
            <Link href="/subscribe">
              <Button variant="primary" size="sm">
                Subscribe
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isExpiringSoon = daysRemaining <= 7;

  return (
    <Card
      className={`border-[#14F195]/30 ${
        isExpiringSoon ? "bg-yellow-500/10" : "bg-[#14F195]/10"
      }`}
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#14F195]">
                {subscription.plan} Plan
              </h3>
              <span className="rounded-full bg-[#14F195] px-2 py-0.5 text-xs font-medium text-black">
                Active
              </span>
            </div>
            <p className="text-sm text-[#8f8f8f] mt-1">
              {daysRemaining} days remaining
              {isExpiringSoon && " • Expires soon!"}
            </p>
            <p className="text-xs text-[#8f8f8f] mt-1">
              Subscribed:{" "}
              {new Date(subscription.subscribedAt).toLocaleDateString()}
            </p>
          </div>
          {isExpiringSoon && (
            <Link href="/subscribe">
              <Button variant="secondary" size="sm">
                Renew
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
