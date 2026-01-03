/**
 * useTransfer Hook
 *
 * Custom hook for gasless SOL transfers with LazorKit.
 * Handles validation, instruction creation, and transaction execution.
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import {
  createTransferInstruction,
  validateAddress,
  validateAmount,
} from "@/lib/services";
import { useTransaction, useSolBalance } from "@/features/wallet/hooks";
import toast from "react-hot-toast";

interface UseTransferReturn {
  /** Transfer SOL to a recipient */
  transfer: (recipient: string, amount: string) => Promise<string | null>;
  /** Loading state */
  loading: boolean;
  /** Current SOL balance */
  balance: number | null;
  /** Balance loading state */
  balanceLoading: boolean;
  /** Refresh balance */
  refreshBalance: () => Promise<void>;
  /** Last error message */
  error: string | null;
}

/**
 * Hook to transfer SOL gaslessly
 *
 * @example
 * ```tsx
 * const { transfer, loading, balance } = useTransfer();
 *
 * const handleSend = async () => {
 *   const sig = await transfer("recipient-address", "0.1");
 *   if (sig) {
 *     console.log("Transfer complete:", sig);
 *   }
 * };
 * ```
 */
export function useTransfer(): UseTransferReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const {
    balance,
    loading: balanceLoading,
    refresh: refreshBalance,
  } = useSolBalance();
  const { execute, loading, error } = useTransaction({
    successMessage: "Transfer successful! 🎉",
  });

  const transfer = useCallback(
    async (recipient: string, amount: string): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      // Validate recipient address
      const recipientPubkey = validateAddress(recipient);
      if (!recipientPubkey) {
        toast.error("Invalid recipient address");
        return null;
      }

      // Validate amount
      const amountValue = validateAmount(amount, 0);
      if (!amountValue) {
        toast.error("Invalid amount. Must be greater than 0");
        return null;
      }

      // Check balance
      if (balance !== null && amountValue > balance) {
        toast.error(`Insufficient balance. You have ${balance.toFixed(4)} SOL`);
        return null;
      }

      const instruction = createTransferInstruction(
        smartWalletPubkey,
        recipientPubkey,
        amountValue
      );

      const sig = await execute([instruction]);

      // Refresh balance after successful transfer
      if (sig) {
        refreshBalance();
      }

      return sig;
    },
    [isConnected, smartWalletPubkey, balance, execute, refreshBalance]
  );

  return { transfer, loading, balance, balanceLoading, refreshBalance, error };
}
