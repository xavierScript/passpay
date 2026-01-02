"use client";

import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, NotConnectedState } from "@/components/dashboard";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { getActiveSubscription, getDaysRemaining } from "@/lib/services";

const premiumContent = [
  {
    title: "Premium Video 1",
    description: "Exclusive tutorial on building smart contracts.",
  },
  {
    title: "Premium Video 2",
    description: "Deep dive into Solana architecture.",
  },
  {
    title: "Premium Video 3",
    description: "Advanced passkey authentication patterns.",
  },
];

export default function PremiumPage() {
  const { isConnected, smartWalletPubkey } = useWallet();

  if (!isConnected) {
    return (
      <NotConnectedState
        title="Premium Content"
        message="Please connect your wallet to access premium content."
      />
    );
  }

  // Get subscription details
  const wallet = smartWalletPubkey?.toBase58() || "";
  const subscription = getActiveSubscription(wallet);
  const daysRemaining = getDaysRemaining(wallet);

  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl">
          <PageHeader
            icon="⭐"
            title="Premium Content"
            description="Exclusive content for subscribed users"
          />

          {/* Subscription Status Banner */}
          {subscription && (
            <Card className="mb-6 border-[#14F195]/30 bg-[#14F195]/10">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#14F195]">
                      {subscription.plan} Plan Active
                    </h3>
                    <p className="text-sm text-[#8f8f8f]">
                      {daysRemaining} days remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8f8f8f]">Subscribed on</p>
                    <p className="text-sm font-medium">
                      {new Date(subscription.subscribedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {premiumContent.map((item) => (
              <Card key={item.title} className="border-[#1a1a1a] bg-[#0a0a0a]">
                <CardContent className="pt-4">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="text-sm text-[#8f8f8f]">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
}
