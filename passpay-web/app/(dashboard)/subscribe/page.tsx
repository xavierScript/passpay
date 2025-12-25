"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { PLANS } from "@/lib/constants";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SubscribePage() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(planId: string) {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first.");
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          walletAddress: smartWalletPubkey.toBase58(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Subscription created! Redirecting...");
        router.push("/manage");
      } else {
        toast.error(data.error || "Subscription failed");
      }
    } catch (e) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <h1 className="mb-8 text-center text-4xl font-bold">Choose Your Plan</h1>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {PLANS.map((plan, idx) => (
          <SubscriptionCard
            key={plan.id}
            title={plan.name}
            price={plan.amount}
            description={plan.description}
            onSubscribe={() => handleSubscribe(plan.id)}
            highlighted={idx === 1}
          />
        ))}
      </div>
      {loading && (
        <p className="mt-4 text-center">Processing subscription...</p>
      )}
    </div>
  );
}
