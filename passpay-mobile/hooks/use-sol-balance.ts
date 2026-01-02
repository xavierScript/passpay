/**
 * useSolBalance Hook
 *
 * A reusable hook for fetching and managing SOL balance with:
 * - Automatic fetching on focus
 * - Pull-to-refresh support
 * - Cache invalidation
 * - Loading states
 *
 * @example
 * ```tsx
 * const { balance, loading, refresh, refreshing, refreshControl } = useSolBalance(publicKey);
 *
 * // Use in ScrollView
 * <ScrollView refreshControl={refreshControl}>
 *   <Text>{balance} SOL</Text>
 * </ScrollView>
 * ```
 */

import { AppColors } from "@/constants/theme";
import { clearCache, getSolBalance } from "@/services/rpc";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { PublicKey } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";

export interface UseSolBalanceOptions {
  /** Whether to auto-fetch on focus. Default: true */
  autoFetch?: boolean;
  /** Custom public key to use instead of connected wallet */
  publicKey?: PublicKey | null;
}

export interface UseSolBalanceReturn {
  /** Current SOL balance */
  balance: number;
  /** Whether the balance is loading */
  loading: boolean;
  /** Whether pull-to-refresh is in progress */
  refreshing: boolean;
  /** Manually refresh the balance */
  refresh: () => Promise<void>;
  /** Pre-configured RefreshControl component */
  refreshControl: React.ReactElement<RefreshControlProps> | undefined;
  /** Format balance for display */
  formattedBalance: string;
}

export function useSolBalance(
  options: UseSolBalanceOptions = {}
): UseSolBalanceReturn {
  const { autoFetch = true, publicKey: customPubkey } = options;
  const { smartWalletPubkey, isConnected } = useWallet();

  // Use provided pubkey or fallback to connected wallet
  const pubkey = customPubkey ?? smartWalletPubkey;

  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!pubkey) {
      setBalance(0);
      return;
    }

    try {
      const solBalance = await getSolBalance(pubkey);
      setBalance(solBalance);
    } catch (error) {
      console.error("[useSolBalance] Error fetching balance:", error);
    }
  }, [pubkey]);

  // Auto-fetch on focus
  useFocusEffect(
    useCallback(() => {
      if (!autoFetch) return;
      if (!isConnected || !pubkey) {
        setBalance(0);
        return;
      }

      setLoading(true);
      fetchBalance().finally(() => setLoading(false));
    }, [autoFetch, isConnected, pubkey, fetchBalance])
  );

  // Pull-to-refresh handler
  const refresh = useCallback(async () => {
    setRefreshing(true);
    clearCache();
    await fetchBalance();
    setRefreshing(false);
  }, [fetchBalance]);

  // Pre-configured RefreshControl
  const refreshControl =
    isConnected && pubkey
      ? React.createElement(RefreshControl, {
          refreshing,
          onRefresh: refresh,
          tintColor: AppColors.primary,
          colors: [AppColors.primary],
        })
      : undefined;

  // Formatted balance string
  const formattedBalance = balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return {
    balance,
    loading,
    refreshing,
    refresh,
    refreshControl,
    formattedBalance,
  };
}
