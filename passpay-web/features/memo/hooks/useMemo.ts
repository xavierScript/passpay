/**
 * useMemo Hook
 *
 * Custom hook for writing on-chain memos with LazorKit.
 * Wraps memo instruction creation and transaction execution.
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { createMemoInstruction, validateMemo } from "@/lib/services";
import { useTransaction } from "@/features/wallet/hooks";
import toast from "react-hot-toast";

interface UseMemoReturn {
  /** Write a memo on-chain */
  writeMemo: (message: string) => Promise<string | null>;
  /** Loading state */
  loading: boolean;
  /** Last error message */
  error: string | null;
}

/**
 * Hook to write on-chain memos
 *
 * @example
 * ```tsx
 * const { writeMemo, loading } = useMemo();
 *
 * const handleSubmit = async () => {
 *   const sig = await writeMemo("Hello, Solana!");
 *   if (sig) {
 *     console.log("Memo stored:", sig);
 *   }
 * };
 * ```
 */
export function useMemoHook(): UseMemoReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { execute, loading, error } = useTransaction({
    successMessage: "Memo stored on-chain! 📝",
  });

  const writeMemo = useCallback(
    async (message: string): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      // Validate memo
      const validationError = validateMemo(message);
      if (validationError) {
        toast.error(validationError);
        return null;
      }

      // Use signed memo instruction (LazorKit requires at least one account key)
      const instruction = createMemoInstruction(
        message.trim(),
        smartWalletPubkey
      );
      return execute([instruction]);
    },
    [isConnected, smartWalletPubkey, execute]
  );

  return { writeMemo, loading, error };
}
