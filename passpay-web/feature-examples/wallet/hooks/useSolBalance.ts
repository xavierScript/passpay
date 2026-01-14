/**
 * useSolBalance Hook
 *
 * Custom hook for fetching and managing SOL balance.
 * Handles loading states, caching, and auto-refresh.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@lazorkit/wallet";
import { getSolBalance } from "@/lib/services/rpc";

interface UseSolBalanceOptions {
  /** Auto-fetch on mount when connected */
  autoFetch?: boolean;
}

interface UseSolBalanceReturn {
  /** Current SOL balance (null if not fetched) */
  balance: number | null;
  /** Loading state */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh the balance */
  refresh: () => Promise<void>;
}

/**
 * Hook to manage SOL balance fetching
 *
 * @example
 * ```tsx
 * const { balance, loading, refresh } = useSolBalance();
 *
 * return (
 *   <div>
 *     {loading ? "Loading..." : `${balance?.toFixed(4)} SOL`}
 *     <button onClick={refresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useSolBalance(
  options: UseSolBalanceOptions = {}
): UseSolBalanceReturn {
  const { autoFetch = true } = options;
  const { smartWalletPubkey, isConnected } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!smartWalletPubkey) return;

    setLoading(true);
    setError(null);

    try {
      const bal = await getSolBalance(smartWalletPubkey);
      setBalance(bal);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch balance";
      setError(message);
      console.error("Error fetching balance:", err);
    } finally {
      setLoading(false);
    }
  }, [smartWalletPubkey]);

  // Auto-fetch on mount when connected
  useEffect(() => {
    if (
      autoFetch &&
      isConnected &&
      smartWalletPubkey &&
      !hasFetchedRef.current
    ) {
      hasFetchedRef.current = true;
      refresh();
    }
  }, [autoFetch, isConnected, smartWalletPubkey, refresh]);

  // Reset when disconnected
  useEffect(() => {
    if (!isConnected) {
      setBalance(null);
      hasFetchedRef.current = false;
    }
  }, [isConnected]);

  return { balance, loading, error, refresh };
}
