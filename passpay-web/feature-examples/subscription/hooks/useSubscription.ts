/**
 * useSubscription Hook
 *
 * Custom hook for subscription payments with LazorKit.
 * Handles SOL payment to merchant wallet for subscription plans.
 * Stores subscription data in localStorage for demo purposes.
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RECIPIENT_WALLET } from "@/lib/constants";
import { saveSubscription } from "@/lib/services";
import { useTransaction } from "@/feature-examples/wallet/hooks";
import toast from "react-hot-toast";

interface UseSubscriptionReturn {
  /** Subscribe to a plan */
  subscribe: (amount: number, planName: string) => Promise<string | null>;
  /** Loading state (plan ID when loading, null otherwise) */
  loading: boolean;
  /** Last error message */
  error: string | null;
}

/**
 * Hook to handle subscription payments
 *
 * @example
 * ```tsx
 * const { subscribe, loading } = useSubscription();
 *
 * const handleSubscribe = async () => {
 *   const sig = await subscribe(0.01, "Basic");
 *   if (sig) {
 *     console.log("Subscribed:", sig);
 *   }
 * };
 * ```
 */
export function useSubscription(): UseSubscriptionReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { execute, loading, error } = useTransaction();

  const subscribe = useCallback(
    async (amount: number, planName: string): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      if (amount <= 0) {
        toast.error("Invalid subscription amount");
        return null;
      }

      const destination = new PublicKey(RECIPIENT_WALLET);
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: destination,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      // Custom success message for subscription
      const toastId = toast.loading("Approve with your passkey...");

      try {
        const sig = await execute([instruction]);
        toast.dismiss(toastId);

        if (sig) {
          // Save subscription to localStorage
          saveSubscription(smartWalletPubkey.toBase58(), planName, amount, sig);

          toast.success(`${planName} subscription activated! 🎉`);
        }

        return sig;
      } catch {
        toast.dismiss(toastId);
        return null;
      }
    },
    [isConnected, smartWalletPubkey, execute]
  );

  return { subscribe, loading, error };
}
