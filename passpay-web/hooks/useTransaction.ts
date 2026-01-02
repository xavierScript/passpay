/**
 * useTransaction Hook
 *
 * Custom hook for executing gasless transactions with LazorKit.
 * Handles loading states, error handling, and toast notifications.
 */

import { useState, useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { TransactionInstruction } from "@solana/web3.js";
import toast from "react-hot-toast";

interface UseTransactionOptions {
  /** Toast message while waiting for passkey approval */
  loadingMessage?: string;
  /** Toast message on success */
  successMessage?: string;
}

interface UseTransactionReturn {
  /** Execute the transaction with given instructions */
  execute: (instructions: TransactionInstruction[]) => Promise<string | null>;
  /** Loading state */
  loading: boolean;
  /** Last transaction signature */
  signature: string | null;
  /** Last error message */
  error: string | null;
}

/**
 * Parse and handle transaction errors with user-friendly messages
 */
function parseTransactionError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (
    errorMessage.includes("NotAllowedError") ||
    errorMessage.includes("cancelled") ||
    errorMessage.includes("canceled")
  ) {
    return "You cancelled the passkey prompt. Please try again.";
  }

  if (errorMessage.includes("Signing failed")) {
    return "Signing failed. Please ensure you're using HTTPS and try again.";
  }

  if (
    errorMessage.includes("insufficient") ||
    errorMessage.includes("Insufficient")
  ) {
    return "Insufficient balance for this transaction.";
  }

  if (errorMessage.includes("Transaction too large")) {
    return "Transaction exceeds size limit. This is a known LazorKit paymaster issue - try again or contact support.";
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
    return "Request timed out. Please try again.";
  }

  return errorMessage || "Transaction failed. Please try again.";
}

/**
 * Hook to execute gasless transactions
 *
 * @example
 * ```tsx
 * const { execute, loading } = useTransaction({
 *   successMessage: "Transfer complete! 🎉"
 * });
 *
 * const handleSend = async () => {
 *   const instruction = createTransferInstruction(...);
 *   const sig = await execute([instruction]);
 *   if (sig) {
 *     // Transaction succeeded
 *   }
 * };
 * ```
 */
export function useTransaction(
  options: UseTransactionOptions = {}
): UseTransactionReturn {
  const {
    loadingMessage = "Approve with your passkey...",
    successMessage = "Transaction successful! 🎉",
  } = options;

  const { signAndSendTransaction, isConnected, smartWalletPubkey } =
    useWallet();

  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (instructions: TransactionInstruction[]): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      if (instructions.length === 0) {
        toast.error("No instructions provided");
        return null;
      }

      setLoading(true);
      setError(null);
      const toastId = toast.loading(loadingMessage);

      try {
        const sig = await signAndSendTransaction({
          instructions,
          transactionOptions: {
            feeToken: "USDC", // Gasless - paymaster covers fees
          },
        });

        toast.dismiss(toastId);
        toast.success(successMessage);
        setSignature(sig);
        return sig;
      } catch (err) {
        toast.dismiss(toastId);
        const message = parseTransactionError(err);
        setError(message);
        toast.error(message);
        console.error("Transaction failed:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      isConnected,
      smartWalletPubkey,
      signAndSendTransaction,
      loadingMessage,
      successMessage,
    ]
  );

  return { execute, loading, signature, error };
}
