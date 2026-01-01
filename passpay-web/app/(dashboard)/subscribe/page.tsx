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
 *
 * This is one of the bounty's suggested examples: "Subscription service
 * with automated USDC billing on Solana (powered by smart wallet)"
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PLANS, RECIPIENT_WALLET } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getExplorerUrl } from "@/lib/services/transfer";
import toast from "react-hot-toast";

interface SubscriptionHistory {
  plan: string;
  amount: number;
  signature: string;
  timestamp: Date;
}

export default function SubscribePage() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } =
    useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Processing a Subscription Payment
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Create a transfer instruction to the merchant wallet
   * STEP 2: Sign and send with paymaster (gasless)
   * STEP 3: Record the subscription in your backend (simulated here)
   */
  async function handleSubscribe(
    amount: number,
    planName: string,
    planId: string
  ) {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(planId);
    const toastId = toast.loading("Approve with your passkey...");

    try {
      // 1. Create transfer instruction to merchant
      const destination = new PublicKey(RECIPIENT_WALLET);
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: destination,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      // 2. Sign and send with paymaster
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: "USDC", // Gas paid in USDC by paymaster
        },
      });

      toast.dismiss(toastId);
      toast.success(`${planName} subscription activated! 🎉`);

      // 3. Add to history
      setHistory((prev) => [
        {
          plan: planName,
          amount,
          signature,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } catch (error: unknown) {
      toast.dismiss(toastId);
      const message =
        error instanceof Error ? error.message : "Transaction failed";
      toast.error(message);
      console.error("Subscription failed:", error);
    } finally {
      setLoading(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold">Subscribe</h1>
          <p className="mt-4 text-[#8f8f8f]">
            Please connect your wallet to subscribe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">💳 Subscribe with SOL</h1>
          <p className="mt-2 text-[#8f8f8f]">
            Gasless subscription payments powered by LazorKit ⚡
          </p>
        </div>

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
                  disabled={loading !== null}
                >
                  {loading === plan.id
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
              <div className="text-center">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-sm font-bold text-black">
                  1
                </div>
                <p className="text-white">Choose a plan</p>
              </div>
              <div className="text-center">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-sm font-bold text-black">
                  2
                </div>
                <p className="text-white">Approve with passkey</p>
              </div>
              <div className="text-center">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-sm font-bold text-black">
                  3
                </div>
                <p className="text-white">Paymaster pays gas</p>
              </div>
              <div className="text-center">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#14F195] text-sm font-bold text-black">
                  4
                </div>
                <p className="text-white">Subscription active!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription History */}
        {history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Recent Subscriptions</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[#1a1a1a] bg-[#1a1a1a]/50 p-3"
                  >
                    <div>
                      <p className="font-medium">{sub.plan}</p>
                      <p className="text-sm text-[#8f8f8f]">
                        {sub.amount} SOL • {sub.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <a
                      href={getExplorerUrl(sub.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#14F195] hover:text-[#14F195]/80"
                    >
                      View ↗
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
