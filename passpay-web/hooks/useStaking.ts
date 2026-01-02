/**
 * useStaking Hook
 *
 * Custom hook for SOL staking operations with LazorKit.
 * Handles stake account creation, delegation, and account fetching.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@lazorkit/wallet";
import { PublicKey, Connection } from "@solana/web3.js";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  MIN_STAKE_AMOUNT,
  StakeAccountInfo,
} from "@/lib/services/staking";
import { getSolBalance } from "@/lib/services/rpc";
import { DEFAULT_CONFIG } from "@/lib/constants";
import { useTransaction } from "./useTransaction";
import toast from "react-hot-toast";

interface UseStakingReturn {
  /** Stake SOL to a validator */
  stake: (
    amount: string,
    validatorVoteAccount: string
  ) => Promise<string | null>;
  /** Staking transaction loading state */
  staking: boolean;
  /** Current SOL balance */
  balance: number | null;
  /** User's stake accounts */
  stakeAccounts: StakeAccountInfo[];
  /** Data loading state */
  loading: boolean;
  /** Refresh balance and stake accounts */
  refresh: () => Promise<void>;
  /** Last error message */
  error: string | null;
}

/**
 * Hook to manage SOL staking
 *
 * @example
 * ```tsx
 * const { stake, staking, balance, stakeAccounts } = useStaking();
 *
 * const handleStake = async () => {
 *   const sig = await stake("1.0", validatorVoteAccount);
 *   if (sig) {
 *     console.log("Staked successfully:", sig);
 *   }
 * };
 * ```
 */
export function useStaking(): UseStakingReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const {
    execute,
    loading: staking,
    error,
  } = useTransaction({
    successMessage: "Stake delegated successfully! 🎉",
  });

  const [balance, setBalance] = useState<number | null>(null);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const getConnection = useCallback(() => {
    return new Connection(DEFAULT_CONFIG.rpcUrl, "confirmed");
  }, []);

  const refresh = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setLoading(true);
    try {
      const connection = getConnection();
      const [bal, accounts] = await Promise.all([
        getSolBalance(smartWalletPubkey),
        getStakeAccounts(connection, smartWalletPubkey),
      ]);
      setBalance(bal);
      setStakeAccounts(accounts);
    } catch (err) {
      console.error("Error fetching staking data:", err);
    } finally {
      setLoading(false);
    }
  }, [smartWalletPubkey, getConnection]);

  // Auto-fetch on mount when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refresh();
    }
  }, [isConnected, smartWalletPubkey, refresh]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setBalance(null);
      setStakeAccounts([]);
      hasFetchedRef.current = false;
    }
  }, [isConnected]);

  const stake = useCallback(
    async (
      amount: string,
      validatorVoteAccount: string
    ): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < MIN_STAKE_AMOUNT) {
        toast.error(`Minimum stake is ${MIN_STAKE_AMOUNT} SOL`);
        return null;
      }

      if (balance !== null && amountValue > balance - 0.01) {
        toast.error("Insufficient balance (keep some for rent)");
        return null;
      }

      if (!validatorVoteAccount) {
        toast.error("Please select a validator");
        return null;
      }

      try {
        const connection = getConnection();
        const validatorPubkey = new PublicKey(validatorVoteAccount);

        const { instructions } = await createStakeAccountInstructions(
          connection,
          smartWalletPubkey,
          amountValue,
          validatorPubkey
        );

        const sig = await execute(instructions);

        // Refresh data after successful stake
        if (sig) {
          refresh();
        }

        return sig;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to create stake instructions";
        toast.error(message);
        console.error("Staking failed:", err);
        return null;
      }
    },
    [isConnected, smartWalletPubkey, balance, getConnection, execute, refresh]
  );

  return {
    stake,
    staking,
    balance,
    stakeAccounts,
    loading,
    refresh,
    error,
  };
}
