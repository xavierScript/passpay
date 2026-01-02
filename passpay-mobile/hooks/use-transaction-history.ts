/**
 * useTransactionHistory Hook
 *
 * A hook for managing in-memory transaction history with:
 * - Add new transactions
 * - Automatic timestamp
 * - Maximum history limit
 * - Explorer URL generation
 *
 * @example
 * ```tsx
 * const { history, addTransaction, clearHistory } = useTransactionHistory<TransferRecord>();
 *
 * // After successful transaction
 * addTransaction({ recipient, amount, signature });
 *
 * // Render history
 * {history.map(item => (
 *   <Text onPress={() => openUrl(item.explorerUrl)}>
 *     {item.data.amount} SOL - {item.formattedTime}
 *   </Text>
 * ))}
 * ```
 */

import { getExplorerUrl } from "@/utils/helpers";
import { useCallback, useState } from "react";
import { Linking } from "react-native";

export interface HistoryItem<T> {
  /** Unique ID for the item */
  id: string;
  /** Transaction signature */
  signature: string;
  /** When the transaction was added */
  timestamp: Date;
  /** Formatted time string */
  formattedTime: string;
  /** Explorer URL for the transaction */
  explorerUrl: string;
  /** Custom data attached to this history item */
  data: T;
}

export interface UseTransactionHistoryOptions {
  /** Maximum number of items to keep. Default: 10 */
  maxItems?: number;
  /** Cluster for explorer URLs. Default: 'devnet' */
  cluster?: "devnet" | "mainnet";
}

export interface UseTransactionHistoryReturn<T> {
  /** Array of history items (newest first) */
  history: HistoryItem<T>[];
  /** Add a new transaction to history */
  addTransaction: (signature: string, data: T) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Remove a specific item by ID */
  removeItem: (id: string) => void;
  /** Open a transaction in the explorer */
  openInExplorer: (signature: string) => void;
  /** Whether history is empty */
  isEmpty: boolean;
}

export function useTransactionHistory<T = Record<string, unknown>>(
  options: UseTransactionHistoryOptions = {}
): UseTransactionHistoryReturn<T> {
  const { maxItems = 10, cluster = "devnet" } = options;

  const [history, setHistory] = useState<HistoryItem<T>[]>([]);

  const addTransaction = useCallback(
    (signature: string, data: T) => {
      const timestamp = new Date();
      const newItem: HistoryItem<T> = {
        id: `${signature}-${timestamp.getTime()}`,
        signature,
        timestamp,
        formattedTime: timestamp.toLocaleTimeString(),
        explorerUrl: getExplorerUrl(signature, cluster),
        data,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev];
        // Limit history size
        return updated.slice(0, maxItems);
      });
    },
    [maxItems, cluster]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const openInExplorer = useCallback(
    (signature: string) => {
      const url = getExplorerUrl(signature, cluster);
      Linking.openURL(url);
    },
    [cluster]
  );

  return {
    history,
    addTransaction,
    clearHistory,
    removeItem,
    openInExplorer,
    isEmpty: history.length === 0,
  };
}
