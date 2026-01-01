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

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  createTransferInstruction,
  validateAddress,
  validateAmount,
  truncateAddress,
  getExplorerUrl,
} from "@/lib/services/transfer";
import { getSolBalance } from "@/lib/services/rpc";

interface TransferHistory {
  recipient: string;
  amount: string;
  signature: string;
  timestamp: Date;
}

export default function TransferPage() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<TransferHistory[]>([]);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  // Fetch balance on mount
  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    setBalanceLoading(true);
    try {
      const balance = await getSolBalance(smartWalletPubkey);
      setSolBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchBalance();
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Creating & Sending a Gasless Transfer
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Validate inputs (address and amount)
   * STEP 2: Create a SystemProgram.transfer() instruction
   * STEP 3: Call signAndSendTransaction() with paymaster config
   */
  const handleTransfer = async () => {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate recipient address
    const recipientPubkey = validateAddress(recipient);
    if (!recipientPubkey) {
      toast.error("Invalid recipient address");
      return;
    }

    // Validate amount
    const amountValue = validateAmount(amount, 0);
    if (!amountValue) {
      toast.error("Invalid amount. Must be greater than 0");
      return;
    }

    // Check balance
    if (solBalance !== null && amountValue > solBalance) {
      toast.error(
        `Insufficient balance. You have ${solBalance.toFixed(4)} SOL`
      );
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Approve with your passkey...");

    try {
      // Create transfer instruction
      const instruction = createTransferInstruction(
        smartWalletPubkey,
        recipientPubkey,
        amountValue
      );

      // Sign and send with paymaster (gasless!)
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: "USDC", // 👈 This enables gasless transactions!
        },
      });

      toast.dismiss(toastId);
      toast.success("Transfer successful! 🎉");

      // Add to history
      setHistory((prev) => [
        {
          recipient,
          amount,
          signature,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Clear form and refresh balance
      setRecipient("");
      setAmount("");
      fetchBalance();
    } catch (error: unknown) {
      toast.dismiss(toastId);
      console.error("Transfer failed:", error);

      // Handle specific error types
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("canceled")
      ) {
        toast.error("You cancelled the passkey prompt. Please try again.");
      } else if (errorMessage.includes("Signing failed")) {
        toast.error(
          "Signing failed. Please ensure you're using HTTPS and try again."
        );
      } else if (
        errorMessage.includes("insufficient") ||
        errorMessage.includes("Insufficient")
      ) {
        toast.error("Insufficient balance for this transaction.");
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout")
      ) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(errorMessage || "Transfer failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold">Transfer SOL</h1>
          <p className="mt-4 text-[#8f8f8f]">
            Please connect your wallet to send SOL.
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
          <h1 className="text-3xl font-bold">💸 Transfer SOL</h1>
          <p className="mt-2 text-[#8f8f8f]">
            Send SOL gaslessly - paymaster covers the fees ⚡
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 border-[#14F195]/20 bg-[#14F195]/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8f8f8f]">Available Balance</p>
                <p className="text-2xl font-bold">
                  {balanceLoading ? (
                    <span className="text-[#8f8f8f]">Loading...</span>
                  ) : (
                    <span className="text-[#14F195]">
                      {solBalance?.toFixed(4) ?? "0"} SOL
                    </span>
                  )}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchBalance}
                disabled={balanceLoading}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

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

            {/* Info */}
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-3">
              <p className="text-xs text-[#8f8f8f]">
                💡 <strong>Gasless Transaction:</strong> You don&apos;t need SOL
                for gas fees. LazorKit&apos;s paymaster will cover the
                transaction fee, deducting the equivalent from your USDC
                balance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Recent Transfers</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((tx, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[#1a1a1a] bg-[#1a1a1a]/50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {tx.amount} SOL → {truncateAddress(tx.recipient)}
                      </p>
                      <p className="text-xs text-[#8f8f8f]">
                        {tx.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <a
                      href={getExplorerUrl(tx.signature)}
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
