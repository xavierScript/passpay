"use client";

import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, NotConnectedState } from "@/components/dashboard";

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
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <NotConnectedState
        title="Premium Content"
        message="Please connect your wallet to access premium content."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          icon="⭐"
          title="Premium Content"
          description="Exclusive content for subscribed users"
        />

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
  );
}
