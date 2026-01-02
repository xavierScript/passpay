/**
 * Subscribe Page - Subscription Payments with SOL
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Subscription Payments with LazorKit
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This page demonstrates a real-world use case: subscription payments.
 * - Users pay in SOL for subscription tiers
 * - Transactions are gasless (paymaster covers fees)
 * - Perfect for SaaS products accepting crypto payments
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { PLANS } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks";
import {
  PageHeader,
  NotConnectedState,
  HistoryList,
} from "@/components/dashboard";

interface SubscriptionHistory {
  plan: string;
  amount: number;
  signature: string;
  timestamp: Date;
}

export default function SubscribePage() {
  const { isConnected } = useWallet();
  const { subscribe, loading } = useSubscription();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);

  async function handleSubscribe(
    amount: number,
    planName: string,
    planId: string
  ) {
    setLoadingPlanId(planId);
    const signature = await subscribe(amount, planName);

    if (signature) {
      setHistory((prev) => [
        { plan: planName, amount, signature, timestamp: new Date() },
        ...prev,
      ]);
    }

    setLoadingPlanId(null);
  }

  if (!isConnected) {
    return (
      <NotConnectedState
        title="Subscribe"
        message="Please connect your wallet to subscribe."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon="💳"
          title="Subscribe with SOL"
          description="Gasless subscription payments powered by LazorKit ⚡"
        />

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, idx) => (
            <Card
              key={plan.id}
              className={`transition-all hover:border-[#14F195]/50 ${
                idx === 1
                  ? "border-[#14F195] bg-[#14F195]/10 relative"
                  : "border-[#1a1a1a]"
              }`}
            >
              {idx === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#14F195] px-3 py-1 text-xs font-medium text-black">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.amount}</span>
                  <span className="text-[#8f8f8f] ml-1">SOL</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-[#8f8f8f]">
                  <li className="flex items-center gap-2">
                    <span className="text-[#14F195]">✓</span>
                    Gasless transaction
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#14F195]">✓</span>
                    Instant activation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#14F195]">✓</span>
                    Passkey protected
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant={idx === 1 ? "primary" : "secondary"}
                  onClick={() =>
                    handleSubscribe(plan.amount, plan.name, plan.id)
                  }
                  disabled={loading || loadingPlanId !== null}
                >
                  {loadingPlanId === plan.id
                    ? "Processing..."
                    : `Subscribe ${plan.amount} SOL`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it Works */}
        <Card className="mt-8 border-[#14F195]/30 bg-[#14F195]/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-[#14F195] mb-4">
              🚀 How Gasless Subscriptions Work
            </h3>
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              {[
                { step: 1, label: "Choose a plan" },
                { step: 2, label: "Approve with passkey" },
                { step: 3, label: "Paymaster pays gas" },
                { step: 4, label: "Subscription active!" },
              ].map(({ step, label }) => (
                <div key={step} className="text-center">
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-sm font-bold text-black">
                    {step}
                  </div>
                  <p className="text-white">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription History */}
        <HistoryList
          title="Recent Subscriptions"
          items={history.map((sub) => ({
            primary: sub.plan,
            secondary: `${sub.amount} SOL`,
            signature: sub.signature,
            timestamp: sub.timestamp,
          }))}
        />
      </div>
    </div>
  );
}
