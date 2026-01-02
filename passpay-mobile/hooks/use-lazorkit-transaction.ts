/**
 * useLazorkitTransaction Hook
 *
 * A powerful hook that abstracts LazorKit transaction handling with:
 * - Automatic loading states
 * - Error handling with user-friendly alerts
 * - Success callbacks with transaction signature
 * - Configurable options for gasless transactions
 *
 * This hook eliminates boilerplate code and provides a consistent
 * transaction experience across all screens.
 *
 * @example
 * ```tsx
 * const { execute, loading, lastSignature, error } = useLazorkitTransaction({
 *   onSuccess: (sig) => console.log('Transaction sent!', sig),
 *   gasless: true,
 * });
 *
 * // Execute a transaction
 * await execute({
 *   instructions: [transferInstruction],
 *   redirectPath: 'transfer',
 * });
 * ```
 */

import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { TransactionInstruction } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { Alert, Keyboard } from "react-native";

export type ClusterType = "devnet" | "mainnet";
export type FeeTokenType = "USDC" | "SOL";

export interface TransactionOptions {
  /** Instructions to execute */
  instructions: TransactionInstruction[];
  /** Path for deep link redirect (e.g., 'transfer', 'memo', 'stake') */
  redirectPath?: string;
  /** Override gasless setting for this transaction */
  gasless?: boolean;
  /** Custom compute unit limit */
  computeUnitLimit?: number;
  /** Custom cluster (defaults to devnet) */
  cluster?: ClusterType;
}

export interface UseLazorkitTransactionOptions {
  /** Enable gasless transactions (paymaster pays in USDC). Default: false */
  gasless?: boolean;
  /** Default cluster to use. Default: 'devnet' */
  cluster?: ClusterType;
  /** Callback when transaction succeeds */
  onSuccess?: (signature: string) => void;
  /** Callback when transaction fails */
  onError?: (error: Error) => void;
  /** Whether to show alerts on success/error. Default: true */
  showAlerts?: boolean;
  /** Custom success alert title */
  successAlertTitle?: string;
  /** Custom success alert message (signature will be appended) */
  successAlertMessage?: string;
}

export interface UseLazorkitTransactionReturn {
  /** Execute a transaction with the given options */
  execute: (options: TransactionOptions) => Promise<string | null>;
  /** Whether a transaction is currently in progress */
  loading: boolean;
  /** The signature of the last successful transaction */
  lastSignature: string | null;
  /** The last error that occurred */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
  /** Whether the wallet is ready for transactions */
  isReady: boolean;
}

export function useLazorkitTransaction(
  options: UseLazorkitTransactionOptions = {}
): UseLazorkitTransactionReturn {
  const {
    gasless: defaultGasless = false,
    cluster: defaultCluster = "devnet",
    onSuccess,
    onError,
    showAlerts = true,
    successAlertTitle = "Success! ✅",
    successAlertMessage = "Transaction sent successfully!",
  } = options;

  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [loading, setLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isReady = isConnected && !!smartWalletPubkey;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async (txOptions: TransactionOptions): Promise<string | null> => {
      // Validate wallet connection
      if (!isConnected || !smartWalletPubkey) {
        const err = new Error("Please connect your wallet first");
        setError(err);
        if (showAlerts) {
          Alert.alert("Wallet Not Connected", err.message);
        }
        onError?.(err);
        return null;
      }

      // Validate instructions
      if (!txOptions.instructions || txOptions.instructions.length === 0) {
        const err = new Error("No instructions provided");
        setError(err);
        if (showAlerts) {
          Alert.alert("Error", err.message);
        }
        onError?.(err);
        return null;
      }

      // Dismiss keyboard before transaction
      Keyboard.dismiss();
      setLoading(true);
      setError(null);

      const useGasless = txOptions.gasless ?? defaultGasless;
      const cluster = txOptions.cluster ?? defaultCluster;

      return new Promise((resolve) => {
        signAndSendTransaction(
          {
            instructions: txOptions.instructions,
            transactionOptions: {
              ...(useGasless && { feeToken: "USDC" as FeeTokenType }),
              clusterSimulation: cluster,
              ...(txOptions.computeUnitLimit && {
                computeUnitLimit: txOptions.computeUnitLimit,
              }),
            },
          },
          {
            redirectUrl: getRedirectUrl(txOptions.redirectPath),
            onSuccess: (signature) => {
              console.log("[useLazorkitTransaction] Success:", signature);
              setLastSignature(signature);
              setLoading(false);

              if (showAlerts) {
                Alert.alert(
                  successAlertTitle,
                  `${successAlertMessage}\n\nTx: ${signature.substring(
                    0,
                    20
                  )}...`
                );
              }

              onSuccess?.(signature);
              resolve(signature);
            },
            onFail: (err) => {
              console.error("[useLazorkitTransaction] Failed:", err);
              const error = new Error(
                err?.message || "Transaction failed. Please try again."
              );
              setError(error);
              setLoading(false);

              if (showAlerts) {
                Alert.alert("Transaction Failed", error.message);
              }

              onError?.(error);
              resolve(null);
            },
          }
        ).catch((err: any) => {
          console.error("[useLazorkitTransaction] Error:", err);
          const error = new Error(
            err?.message || "Failed to send transaction. Please try again."
          );
          setError(error);
          setLoading(false);

          if (showAlerts) {
            Alert.alert("Error", error.message);
          }

          onError?.(error);
          resolve(null);
        });
      });
    },
    [
      isConnected,
      smartWalletPubkey,
      signAndSendTransaction,
      defaultGasless,
      defaultCluster,
      onSuccess,
      onError,
      showAlerts,
      successAlertTitle,
      successAlertMessage,
    ]
  );

  return {
    execute,
    loading,
    lastSignature,
    error,
    clearError,
    isReady,
  };
}
