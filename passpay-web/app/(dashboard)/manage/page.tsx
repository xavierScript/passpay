"use client";

import { useWallet } from "@lazorkit/wallet";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSolBalance } from "@/hooks";
import {
  PageHeader,
  NotConnectedState,
  InfoBanner,
  SubscriptionStatus,
} from "@/components/dashboard";
import toast from "react-hot-toast";

const quickActions = [
  {
    href: "/transfer",
    icon: "💸",
    title: "Transfer SOL",
    description: "Send SOL gaslessly to any address",
    color:
      "border-[#1a1a1a] hover:border-[#14F195]/30 bg-[#0a0a0a] hover:bg-[#14F195]/5",
  },
  {
    href: "/memo",
    icon: "📝",
    title: "Write Memo",
    description: "Store messages permanently on-chain",
    color:
      "border-[#1a1a1a] hover:border-amber-500/30 bg-[#0a0a0a] hover:bg-amber-500/5",
  },
  {
    href: "/staking",
    icon: "🥩",
    title: "Stake SOL",
    description: "Delegate to validators and earn rewards",
    color:
      "border-[#1a1a1a] hover:border-purple-500/30 bg-[#0a0a0a] hover:bg-purple-500/5",
  },
  {
    href: "/subscribe",
    icon: "💳",
    title: "Subscribe",
    description: "Subscribe to plans with SOL payments",
    color:
      "border-[#1a1a1a] hover:border-blue-500/30 bg-[#0a0a0a] hover:bg-blue-500/5",
  },
];

export default function ManagePage() {
  const { wallet, isConnected } = useWallet();
  const { balance, loading, refresh } = useSolBalance();

  if (!isConnected || !wallet?.smartWallet) {
    return (
      <NotConnectedState
        title="Welcome to PassPay"
        message="Connect your wallet to get started"
        showSetup
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon="🏠"
          title="Dashboard"
          description="Your passkey-protected Solana wallet on Devnet"
        />

        {/* Wallet Overview */}
        <Card className="mb-6 border-[#14F195]/20 bg-gradient-to-br from-[#14F195]/5 to-[#14F195]/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-[#8f8f8f] mb-1">Wallet Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm md:text-base">
                    {wallet.smartWallet.slice(0, 8)}...
                    {wallet.smartWallet.slice(-8)}
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(wallet.smartWallet);
                        toast.success("Address copied to clipboard");
                      } catch (err) {
                        toast.error("Failed to copy address");
                      }
                    }}
                    className="text-xs text-[#14F195] hover:text-[#14F195]/80"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-[#8f8f8f]">Balance</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <span className="text-[#8f8f8f]">...</span>
                    ) : (
                      <span className="text-[#14F195]">
                        {balance?.toFixed(4) ?? "0"} SOL
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refresh}
                  disabled={loading}
                >
                  ↻
                </Button>
              </div>
            </div>

            {/* Status Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-[#14F195]/10 border border-[#14F195]/20 text-[#14F195]">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#14F195] inline-block animate-pulse"></span>
                Connected
              </Badge>
              <Badge className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#8f8f8f]">
                Devnet
              </Badge>
              <Badge className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#8f8f8f]">
                ⚡ Gasless Mode
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          \n{" "}
          <h2 className="text-lg font-semibold mb-4 text-[#8f8f8f]">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card
                  className={`${action.color} transition-all cursor-pointer`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{action.icon}</span>
                      <div>
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-[#8f8f8f]">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Faucet Info */}
        <InfoBanner icon="💧" title="Need Devnet SOL?" variant="warning">
          Get free devnet SOL from the{" "}
          <a
            href="https://faucet.solana.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 underline hover:text-amber-300"
          >
            Solana Faucet ↗
          </a>
          . Just paste your wallet address above!
        </InfoBanner>
      </div>
    </div>
  );
}
