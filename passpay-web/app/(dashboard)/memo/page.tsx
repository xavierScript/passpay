/**
 * Memo Page - On-Chain Messages
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Writing Permanent Messages on Solana
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This page demonstrates using Solana's Memo Program with LazorKit:
 * - Store arbitrary text permanently on the blockchain
 * - Simple transaction that proves LazorKit integration works
 * - Great for: proof of existence, timestamps, on-chain notes
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemoHook } from "@/hooks";
import {
  PageHeader,
  NotConnectedState,
  InfoBanner,
  HistoryList,
} from "@/components/dashboard";
import { truncateAddress } from "@/lib/services/transfer";

interface MemoHistory {
  message: string;
  signature: string;
  timestamp: Date;
}

export default function MemoPage() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { writeMemo, loading } = useMemoHook();

  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<MemoHistory[]>([]);

  const handleSendMemo = async () => {
    const signature = await writeMemo(message);

    if (signature) {
      setHistory((prev) => [
        { message: message.trim(), signature, timestamp: new Date() },
        ...prev,
      ]);
      setMessage("");
    }
  };

  if (!isConnected) {
    return (
      <NotConnectedState
        title="On-Chain Memos"
        message="Please connect your wallet to write on-chain messages."
      />
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          icon="📝"
          title="On-Chain Memo"
          description="Write permanent messages on the Solana blockchain"
        />

        <InfoBanner icon="💡" title="What is a Memo?" variant="warning">
          Memos are text messages stored permanently in Solana transactions.
          They&apos;re perfect for proof of existence, timestamps, or on-chain
          notes. Limited to 200 characters to fit within transaction size
          limits.
        </InfoBanner>

        {/* Memo Form */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Write a Memo</h2>
            <p className="text-sm text-[#8f8f8f]">
              Your message will be stored forever on-chain
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#8f8f8f]">
                Your Message
                <span className="ml-2 text-xs">
                  ({message.length}/200 characters)
                </span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello, Solana! This message will live forever on-chain..."
                rows={4}
                maxLength={200}
                className="w-full resize-none rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-white placeholder-[#8f8f8f] focus:border-[#14F195] focus:outline-none focus:ring-1 focus:ring-[#14F195]"
              />
              <p className="mt-1 text-right text-xs text-[#8f8f8f]">
                {message.length}/500 characters
              </p>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMemo}
              disabled={loading || !message.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? "Sending..." : "Store Memo On-Chain 📝"}
            </Button>

            <InfoBanner icon="⚡">
              <strong>Gasless:</strong> Transaction fees are covered by
              LazorKit&apos;s paymaster. Just approve with your passkey!
            </InfoBanner>
          </CardContent>
        </Card>

        {/* Memo History */}
        <HistoryList
          title="Your Memos"
          subtitle="Stored permanently on Solana Devnet"
          items={history.map((memo) => ({
            primary: `"${memo.message}"`,
            signature: memo.signature,
            timestamp: memo.timestamp,
          }))}
        />

        {/* Wallet Info */}
        <Card className="mt-6 border-[#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8f8f8f]">Connected Wallet</p>
                <p className="font-mono text-sm text-white">
                  {truncateAddress(smartWalletPubkey?.toBase58() || "", 8)}
                </p>
              </div>
              <a
                href={`https://explorer.solana.com/address/${smartWalletPubkey?.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#14F195] hover:text-[#14F195]/80"
              >
                View Wallet ↗
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
