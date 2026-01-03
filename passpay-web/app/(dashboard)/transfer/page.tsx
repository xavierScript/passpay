/**
 * Transfer Page - Gasless SOL Transfers
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Sending Gasless Transactions with LazorKit
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This page demonstrates LazorKit's gasless transaction feature:
 * - Users send SOL without paying gas fees themselves
 * - A paymaster sponsors the transaction fees (paid in USDC)
 * - Perfect for onboarding users who don't have SOL for fees
 *
 * KEY CONCEPTS:
 * - `signAndSendTransaction()`: Signs with passkey and broadcasts to network
 * - `transactionOptions.feeToken`: Specify "USDC" for gasless (paymaster pays)
 * - `instructions`: Array of Solana instructions to execute
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransfer } from "@/hooks";
import {
  PageHeader,
  NotConnectedState,
  BalanceCard,
  InfoBanner,
  HistoryList,
} from "@/components/dashboard";
import { truncateAddress } from "@/lib/services";

interface TransferHistory {
  recipient: string;
  amount: string;
  signature: string;
  timestamp: Date;
}

export default function TransferPage() {
  const { isConnected } = useWallet();
  const { transfer, loading, balance, balanceLoading, refreshBalance } =
    useTransfer();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<TransferHistory[]>([]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Creating & Sending a Gasless Transfer
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * With the useTransfer hook, all of this is handled automatically!
   */
  const handleTransfer = async () => {
    const signature = await transfer(recipient, amount);

    if (signature) {
      setHistory((prev) => [
        { recipient, amount, signature, timestamp: new Date() },
        ...prev,
      ]);
      setRecipient("");
      setAmount("");
    }
  };

  if (!isConnected) {
    return (
      <NotConnectedState
        title="Transfer SOL"
        message="Please connect your wallet to send SOL."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          icon="💸"
          title="Transfer SOL"
          description="Send SOL gaslessly - paymaster covers the fees ⚡"
        />

        <BalanceCard
          label="Available Balance"
          balance={balance}
          loading={balanceLoading}
          onRefresh={refreshBalance}
          variant="highlight"
        />

        {/* Transfer Form */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Send SOL</h2>
            <p className="text-sm text-[#8f8f8f]">
              Gas fees paid by LazorKit Paymaster
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#8f8f8f]">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address..."
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#8f8f8f] focus:border-[#14F195] focus:outline-none focus:ring-1 focus:ring-[#14F195]"
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#8f8f8f]">
                Amount (SOL)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.001"
                min="0"
                className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#8f8f8f] focus:border-[#14F195] focus:outline-none focus:ring-1 focus:ring-[#14F195]"
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleTransfer}
              disabled={loading || !recipient || !amount}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending..." : "Send SOL ⚡"}
            </Button>

            <InfoBanner icon="💡">
              <strong>Gasless Transaction:</strong> You don&apos;t need SOL for
              gas fees. LazorKit&apos;s paymaster will cover the transaction
              fee, deducting the equivalent from your USDC balance.
            </InfoBanner>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <HistoryList
          title="Recent Transfers"
          items={history.map((tx) => ({
            primary: `${tx.amount} SOL → ${truncateAddress(tx.recipient)}`,
            signature: tx.signature,
            timestamp: tx.timestamp,
          }))}
        />
      </div>
    </div>
  );
}
