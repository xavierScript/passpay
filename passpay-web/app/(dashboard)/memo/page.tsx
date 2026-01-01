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
 *
 * This is a great "hello world" for LazorKit - if this works, your
 * integration is set up correctly!
 */

"use client";

import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { createMemoInstruction, validateMemo } from "@/lib/services/memo";
import { getExplorerUrl, truncateAddress } from "@/lib/services/transfer";

interface MemoHistory {
  message: string;
  signature: string;
  timestamp: Date;
}

export default function MemoPage() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MemoHistory[]>([]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Sending a Memo Transaction
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Validate the message
   * STEP 2: Create a memo instruction with the message
   * STEP 3: Sign and send with paymaster
   */
  const handleSendMemo = async () => {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate memo
    const error = validateMemo(message);
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Approve with your passkey...");

    try {
      // Create memo instruction
      const instruction = createMemoInstruction(
        message.trim(),
        smartWalletPubkey
      );

      // Sign and send with paymaster
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: "USDC",
        },
      });

      toast.dismiss(toastId);
      toast.success("Memo stored on-chain! 📝");

      // Add to history
      setHistory((prev) => [
        {
          message: message.trim(),
          signature,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Clear form
      setMessage("");
    } catch (error: unknown) {
      toast.dismiss(toastId);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send memo";
      toast.error(errorMessage);
      console.error("Memo failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold">On-Chain Memos</h1>
          <p className="mt-4 text-[#8f8f8f]">
            Please connect your wallet to write on-chain messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">📝 On-Chain Memo</h1>
          <p className="mt-2 text-[#8f8f8f]">
            Write permanent messages on the Solana blockchain
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-amber-800 bg-amber-900/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium text-amber-200">What is a Memo?</p>
                <p className="mt-1 text-sm text-amber-200/70">
                  Memos are text messages stored permanently in Solana
                  transactions. They&apos;re perfect for proof of existence,
                  timestamps, or on-chain notes. This is also a great way to
                  verify your LazorKit integration works!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello, Solana! This message will live forever on-chain..."
                rows={4}
                maxLength={500}
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

            {/* Cost Info */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-3">
              <p className="text-xs text-[#8f8f8f]">
                ⚡ <strong>Gasless:</strong> Transaction fees are covered by
                LazorKit&apos;s paymaster. Just approve with your passkey!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memo History */}
        {history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Your Memos</h2>
              <p className="text-sm text-[#8f8f8f]">
                Stored permanently on Solana Devnet
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((memo, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[#1a1a1a] bg-[#1a1a1a]/50 p-4"
                  >
                    <p className="text-sm text-white">
                      &ldquo;{memo.message}&rdquo;
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-[#8f8f8f]">
                        {memo.timestamp.toLocaleString()}
                      </p>
                      <a
                        href={getExplorerUrl(memo.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#14F195] hover:text-[#14F195]/80"
                      >
                        View on Explorer ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
