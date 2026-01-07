/**
 * useTransactionHistory Hook
 *
 * A hook for managing persistent transaction history with:
 * - Add new transactions
 * - Automatic timestamp
 * - Maximum history limit
 * - Explorer URL generation
 * - AsyncStorage persistence (survives app restarts)
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
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  /** Storage key for persistence. Default: 'transaction_history' */
  storageKey?: string;
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
  const {
    maxItems = 10,
    cluster = "devnet",
    storageKey = "transaction_history",
  } = options;

  const [history, setHistory] = useState<HistoryItem<T>[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from AsyncStorage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedData = await AsyncStorage.getItem(storageKey);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // Convert timestamp strings back to Date objects
          const restored = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setHistory(restored);
        }
      } catch (error) {
        console.error("Failed to load transaction history:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadHistory();
  }, [storageKey]);

  // Save history to AsyncStorage whenever it changes (after initial load)
  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load

    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        console.error("Failed to save transaction history:", error);
      }
    };
    saveHistory();
  }, [history, storageKey, isLoaded]);

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
