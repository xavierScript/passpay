# Tutorial 3: Building Reusable Hooks

**Time to complete: 25-30 minutes**

Learn how to abstract LazorKit patterns into production-ready custom React hooks. These hooks reduce boilerplate, ensure consistency, and make your codebase maintainable.

---

## 📚 Table of Contents

1. [Why Custom Hooks?](#why-custom-hooks)
2. [Hook Architecture Overview](#hook-architecture-overview)
3. [Hook 1: useLazorkitTransaction](#hook-1-uselazorkittransaction)
4. [Hook 2: useWalletGuard](#hook-2-usewalletguard)
5. [Hook 3: useSolBalance](#hook-3-usesolbalance)
6. [Hook 4: useTransactionHistory](#hook-4-usetransactionhistory)
7. [Hook 5: useClipboard](#hook-5-useclipboard)
8. [Composing Hooks Together](#composing-hooks-together)
9. [Best Practices](#best-practices)

---

## Why Custom Hooks?

### The Problem: Repeated Boilerplate

Without custom hooks, every screen has repeated code:

```typescript
// ❌ Without hooks - repeated in EVERY screen
function TransferScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check connection (repeated)
  if (!isConnected) {
    return <NotConnectedView />;
  }

  const handleTransaction = async () => {
    setLoading(true);
    try {
      await signAndSendTransaction(/* ... */);
      Alert.alert("Success!");
    } catch (e) {
      setError(e);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };
  // ... 50+ more lines of repeated logic
}
```

### The Solution: Custom Hooks

```typescript
// ✅ With custom hooks - clean and reusable
function TransferScreen() {
  const { isConnected, NotConnectedView } = useWalletGuard();
  const { execute, loading } = useLazorkitTransaction({ gasless: true });

  if (!isConnected) return <NotConnectedView />;

  const handleTransfer = () =>
    execute({
      instructions: [transferIx],
    });

  return <Button onPress={handleTransfer} loading={loading} />;
}
```

### Benefits

| Without Hooks               | With Hooks                 |
| --------------------------- | -------------------------- |
| 100+ lines per screen       | 30 lines per screen        |
| Inconsistent error handling | Unified error handling     |
| Bugs duplicated everywhere  | Fix once, fixed everywhere |
| Hard to test                | Easy to unit test          |
| Onboarding takes days       | Onboarding takes hours     |

---

## Hook Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOOK ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Screen Layer                    Hook Layer                  LazorKit SDK
         │                              │                            │
         │  useLazorkitTransaction()    │                            │
         │─────────────────────────────>│  signAndSendTransaction()  │
         │                              │───────────────────────────>│
         │                              │                            │
         │  useWalletGuard()            │  useWallet()               │
         │─────────────────────────────>│───────────────────────────>│
         │                              │                            │
         │  useSolBalance()             │  connection.getBalance()   │
         │─────────────────────────────>│───────────────────────────>│
         │                              │                            │
         ▼                              ▼                            ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Screens import hooks    │  Hooks handle logic     │  SDK handles network   │
│  → Simple components     │  → State management     │  → Blockchain calls    │
│  → UI focused            │  → Error handling       │  → Signing             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hook 1: useLazorkitTransaction

The most important hook - abstracts all transaction handling.

### Full Implementation

```typescript
// hooks/use-lazorkit-transaction.ts
/**
 * useLazorkitTransaction Hook
 *
 * Abstracts LazorKit transaction handling with:
 * - Automatic loading states
 * - Error handling with user-friendly alerts
 * - Success callbacks with transaction signature
 * - Configurable options for gasless transactions
 */

import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { TransactionInstruction } from "@solana/web3.js";
import { useCallback, useState } from "react";
import { Alert, Keyboard } from "react-native";

// ============================================
// TYPES
// ============================================

export type ClusterType = "devnet" | "mainnet";
export type FeeTokenType = "USDC" | "SOL";

export interface TransactionOptions {
  /** Instructions to execute */
  instructions: TransactionInstruction[];
  /** Path for deep link redirect (e.g., 'transfer', 'stake') */
  redirectPath?: string;
  /** Override gasless setting for this transaction */
  gasless?: boolean;
  /** Custom compute unit limit */
  computeUnitLimit?: number;
  /** Custom cluster (defaults to devnet) */
  cluster?: ClusterType;
}

export interface UseLazorkitTransactionOptions {
  /** Enable gasless transactions (paymaster pays). Default: false */
  gasless?: boolean;
  /** Default cluster. Default: 'devnet' */
  cluster?: ClusterType;
  /** Callback when transaction succeeds */
  onSuccess?: (signature: string) => void;
  /** Callback when transaction fails */
  onError?: (error: Error) => void;
  /** Show alerts on success/error. Default: true */
  showAlerts?: boolean;
  /** Custom success alert title */
  successAlertTitle?: string;
  /** Custom success alert message */
  successAlertMessage?: string;
}

export interface UseLazorkitTransactionReturn {
  /** Execute a transaction */
  execute: (options: TransactionOptions) => Promise<string | null>;
  /** Whether transaction is in progress */
  loading: boolean;
  /** Last successful signature */
  lastSignature: string | null;
  /** Last error */
  error: Error | null;
  /** Clear error state */
  clearError: () => void;
  /** Whether wallet is ready */
  isReady: boolean;
}
```

_Listing 3-1: Type definitions for the useLazorkitTransaction hook_

These types define the contract for our transaction hook. Let's examine the key interfaces:

```typescript
export interface TransactionOptions {
  instructions: TransactionInstruction[];
  redirectPath?: string;
  gasless?: boolean;
  computeUnitLimit?: number;
  cluster?: ClusterType;
}
```

The `TransactionOptions` interface describes what you pass when executing a transaction:

- `instructions`: The Solana instructions to execute (required)
- `redirectPath`: Appended to the redirect URL for deep link routing
- `gasless`: Override the hook's default gasless setting
- `computeUnitLimit`: For complex transactions that need more compute
- `cluster`: Switch between devnet and mainnet

```typescript
export interface UseLazorkitTransactionOptions {
  gasless?: boolean;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  showAlerts?: boolean;
  // ...
}
```

The hook options configure default behavior. The `onSuccess` and `onError` callbacks let parent components react to transaction outcomes—perfect for refreshing balances or navigating away.

```typescript
// ============================================
// HOOK IMPLEMENTATION
// ============================================

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

  const clearError = useCallback(() => setError(null), []);

  const execute = useCallback(
    async (txOptions: TransactionOptions): Promise<string | null> => {
      const {
        instructions,
        redirectPath = "",
        gasless = defaultGasless,
        computeUnitLimit,
        cluster = defaultCluster,
      } = txOptions;

      // Validation
      if (!isReady) {
        const err = new Error("Wallet not connected");
        setError(err);
        if (showAlerts) {
          Alert.alert("Error", "Please connect your wallet first");
        }
        onError?.(err);
        return null;
      }

      if (!instructions || instructions.length === 0) {
        const err = new Error("No instructions provided");
        setError(err);
        if (showAlerts) {
          Alert.alert("Error", "No transaction instructions provided");
        }
        onError?.(err);
        return null;
      }

      // Dismiss keyboard before transaction
      Keyboard.dismiss();

      setLoading(true);
      setError(null);

      try {
        // Build transaction options
        const transactionOptions: any = {
          clusterSimulation: cluster,
        };

        // Enable gasless if requested
        if (gasless) {
          transactionOptions.feeToken = "USDC";
        }

        // Set compute limit if provided
        if (computeUnitLimit) {
          transactionOptions.computeUnitLimit = computeUnitLimit;
        }

        console.log(
          `🚀 Executing transaction with ${instructions.length} instruction(s)`
        );
        console.log(`   Gasless: ${gasless}`);
        console.log(`   Cluster: ${cluster}`);

        // Execute the transaction
        const signature = await signAndSendTransaction(
          {
            instructions,
            transactionOptions,
          },
          {
            redirectUrl: getRedirectUrl(redirectPath),
            onSuccess: (sig) => {
              console.log("✅ Transaction successful:", sig);
              setLastSignature(sig);
              setLoading(false);

              if (showAlerts) {
                Alert.alert(successAlertTitle, successAlertMessage);
              }

              onSuccess?.(sig);
            },
```

_Listing 3-2: The execute function implementation_

Let's examine the key implementation details:

```typescript
Keyboard.dismiss();
```

We dismiss the keyboard before starting the transaction. This prevents the keyboard from covering alerts and improves the UX when the browser opens for signing.

```typescript
if (gasless) {
  transactionOptions.feeToken = "USDC";
}
```

Setting `feeToken: "USDC"` enables gasless mode—the paymaster pays transaction fees in USDC on behalf of the user. Without this, users would need SOL for fees.

```typescript
const signature = await signAndSendTransaction(
  { instructions, transactionOptions },
  {
    redirectUrl: getRedirectUrl(redirectPath),
    onSuccess: (sig) => {
      /* ... */
    },
  }
);
```

The `signAndSendTransaction` call opens the browser for passkey signing. The `redirectPath` parameter lets you route back to specific screens—for example, passing `"transfer"` might redirect to `passpay://transfer` after signing.
onFail: (err) => {
console.error("❌ Transaction failed:", err);
setError(err);
setLoading(false);

              if (showAlerts) {
                Alert.alert(
                  "Transaction Failed",
                  err.message || "Unknown error occurred"
                );
              }

              onError?.(err);
            },
          }
        );

        return signature;
      } catch (err: any) {
        console.error("❌ Transaction error:", err);
        setError(err);
        setLoading(false);

        if (showAlerts) {
          Alert.alert("Error", err.message || "Failed to send transaction");
        }

        onError?.(err);
        return null;
      }
    },
    [
      isReady,
      signAndSendTransaction,
      defaultGasless,
      defaultCluster,
      showAlerts,
      successAlertTitle,
      successAlertMessage,
      onSuccess,
      onError,
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

````

### Usage Examples

```typescript
// Basic gasless transaction
const { execute, loading } = useLazorkitTransaction({
  gasless: true,
  onSuccess: (sig) => console.log("Sent!", sig),
});

await execute({ instructions: [transferIx] });

// With custom options
const { execute } = useLazorkitTransaction({
  gasless: true,
  successAlertTitle: "🎉 Staked!",
  successAlertMessage: "Your SOL is now staking",
});

await execute({
  instructions: stakeInstructions,
  computeUnitLimit: 300_000,
});
````

---

## Hook 2: useWalletGuard

Simplifies wallet connection checking with a pre-built "not connected" UI.

### Full Implementation

```typescript
// features/wallet/hooks/use-wallet-guard.tsx
/**
 * useWalletGuard Hook
 *
 * Provides wallet connection state with:
 * - Easy connection status check
 * - "Not connected" UI rendering helper
 * - Wallet address utilities
 */

import { truncateAddress } from "@/utils/helpers";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface UseWalletGuardOptions {
  /** Icon for not-connected state */
  icon?: string;
  /** Message for not-connected state */
  message?: string;
  /** Submessage for not-connected state */
  subMessage?: string;
}

export interface UseWalletGuardReturn {
  /** Is wallet connected? */
  isConnected: boolean;
  /** Full wallet address (base58) */
  address: string | null;
  /** Truncated address for display */
  truncatedAddress: string;
  /** Wallet public key */
  publicKey: ReturnType<typeof useWallet>["smartWalletPubkey"];
  /** Pre-built "not connected" view */
  NotConnectedView: React.FC;
}

export function useWalletGuard(
  options: UseWalletGuardOptions = {}
): UseWalletGuardReturn {
  const {
    icon = "🔐",
    message = "Connect your wallet to continue",
    subMessage = "Go to the Wallet tab to connect",
  } = options;

  const { isConnected, smartWalletPubkey } = useWallet();

  const address = smartWalletPubkey?.toBase58() ?? null;
  const truncated = address ? truncateAddress(address, 6, 6) : "";

  // Pre-built component for not-connected state
  const NotConnectedView: React.FC = () => (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>{subMessage}</Text>
      </View>
    </View>
  );

  return {
    isConnected,
    address,
    truncatedAddress: truncated,
    publicKey: smartWalletPubkey,
    NotConnectedView,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
```

### Usage

```typescript
function TransferScreen() {
  const { isConnected, address, truncatedAddress, NotConnectedView } =
    useWalletGuard({
      icon: "💸",
      message: "Connect wallet to send SOL",
    });

  // Early return for not connected
  if (!isConnected) {
    return <NotConnectedView />;
  }

  return (
    <View>
      <Text>Connected: {truncatedAddress}</Text>
      {/* Rest of UI */}
    </View>
  );
}
```

---

## Hook 3: useSolBalance

Auto-fetching SOL balance with pull-to-refresh support.

### Full Implementation

```typescript
// hooks/use-sol-balance.ts
/**
 * useSolBalance Hook
 *
 * Provides SOL balance with:
 * - Auto-fetch on screen focus
 * - Pull-to-refresh support
 * - Formatted display values
 * - Loading states
 */

import { getConnection } from "@/services/rpc";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl } from "react-native";

export interface UseSolBalanceReturn {
  /** Balance in SOL (null if not loaded) */
  balance: number | null;
  /** Loading state */
  loading: boolean;
  /** Formatted balance string (e.g., "1.234") */
  formattedBalance: string;
  /** Refresh the balance */
  refresh: () => Promise<void>;
  /** RefreshControl component for ScrollView */
  refreshControl: React.ReactElement;
}

export function useSolBalance(): UseSolBalanceReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !smartWalletPubkey) {
      setBalance(null);
      return;
    }

    try {
      const connection = getConnection();
      const lamports = await connection.getBalance(smartWalletPubkey);
      const sol = lamports / LAMPORTS_PER_SOL;
      setBalance(sol);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }, [isConnected, smartWalletPubkey]);

  // Fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchBalance().finally(() => setLoading(false));
    }, [fetchBalance])
  );

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
  }, [fetchBalance]);

  // Format balance for display
  const formattedBalance = balance !== null ? balance.toFixed(4) : "-.----";

  // Pre-built RefreshControl
  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="#9945FF"
      colors={["#9945FF"]}
    />
  );

  return {
    balance,
    loading,
    formattedBalance,
    refresh: fetchBalance,
    refreshControl,
  };
}
```

### Usage

```typescript
function WalletScreen() {
  const { formattedBalance, loading, refreshControl } = useSolBalance();

  return (
    <ScrollView refreshControl={refreshControl}>
      <Text style={styles.balance}>
        {loading ? "Loading..." : `${formattedBalance} SOL`}
      </Text>
    </ScrollView>
  );
}
```

---

## Hook 4: useTransactionHistory

In-memory transaction history with explorer links.

### Full Implementation

```typescript
// hooks/use-transaction-history.ts
/**
 * useTransactionHistory Hook
 *
 * Manages transaction history with:
 * - Add/remove transactions
 * - Automatic timestamps
 * - Explorer URL generation
 * - Maximum history limit
 */

import { getExplorerUrl } from "@/utils/helpers";
import { useCallback, useState } from "react";
import { Linking } from "react-native";

export interface HistoryItem<T> {
  id: string;
  signature: string;
  timestamp: Date;
  formattedTime: string;
  explorerUrl: string;
  data: T;
}

export interface UseTransactionHistoryOptions {
  /** Max items to keep. Default: 10 */
  maxItems?: number;
  /** Cluster for explorer URLs. Default: 'devnet' */
  cluster?: "devnet" | "mainnet";
}

export function useTransactionHistory<T = Record<string, unknown>>(
  options: UseTransactionHistoryOptions = {}
) {
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

      setHistory((prev) => [newItem, ...prev].slice(0, maxItems));
    },
    [maxItems, cluster]
  );

  const clearHistory = useCallback(() => setHistory([]), []);

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
```

### Usage

```typescript
interface TransferData {
  recipient: string;
  amount: string;
}

function TransferScreen() {
  const { history, addTransaction, openInExplorer } =
    useTransactionHistory<TransferData>();

  const { execute } = useLazorkitTransaction({
    onSuccess: (sig) => {
      addTransaction(sig, { recipient, amount });
    },
  });

  return (
    <View>
      {history.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => openInExplorer(item.signature)}
        >
          <Text>
            {item.data.amount} SOL → {item.data.recipient}
          </Text>
          <Text>{item.formattedTime}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Hook 5: useClipboard

Simple clipboard operations with feedback.

### Full Implementation

```typescript
// hooks/use-clipboard.ts
/**
 * useClipboard Hook
 *
 * Provides clipboard operations with:
 * - Copy with success feedback
 * - Auto-reset "copied" state
 * - Error handling
 */

import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useState, useRef, useEffect } from "react";

export interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<void>;
  /** Whether text was just copied */
  copied: boolean;
  /** Last error */
  error: Error | null;
}

export function useClipboard(resetDelay: number = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await Clipboard.setStringAsync(text);

        // Haptic feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        setCopied(true);
        setError(null);

        // Reset after delay
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);
      } catch (err: any) {
        setError(err);
        setCopied(false);
      }
    },
    [resetDelay]
  );

  return { copy, copied, error };
}
```

### Usage

```typescript
function WalletCard() {
  const { copy, copied } = useClipboard();
  const address = "4UjfJZ8K1234...";

  return (
    <TouchableOpacity onPress={() => copy(address)}>
      <Text>{address}</Text>
      <Text>{copied ? "✓ Copied!" : "Tap to copy"}</Text>
    </TouchableOpacity>
  );
}
```

---

## Composing Hooks Together

### Export All Hooks

```typescript
// hooks/index.ts
/**
 * Custom Hooks for PassPay
 *
 * Centralized exports for all custom hooks.
 */

export { useLazorkitTransaction } from "./use-lazorkit-transaction";
export { useWalletGuard } from "./use-wallet-guard";
export { useSolBalance } from "./use-sol-balance";
export { useTransactionHistory } from "./use-transaction-history";
export { useClipboard } from "./use-clipboard";
export { useColorScheme } from "./use-color-scheme";

// Re-export types
export type {
  TransactionOptions,
  UseLazorkitTransactionOptions,
} from "./use-lazorkit-transaction";
```

### Complete Screen Example

Using all hooks together in a real screen:

```typescript
// app/(tabs)/transfer.tsx
import {
  useWalletGuard,
  useLazorkitTransaction,
  useClipboard,
  useTransactionHistory,
} from "@/hooks";

interface TransferRecord {
  recipient: string;
  amount: string;
}

export default function TransferScreen() {
  // 🔐 Wallet guard - handles "not connected" state
  const { isConnected, address, publicKey, NotConnectedView } = useWalletGuard({
    icon: "💸",
    message: "Connect wallet to send SOL",
  });

  // 📋 Clipboard - copy with feedback
  const { copy, copied } = useClipboard();

  // 📜 Transaction history - track sent transfers
  const { history, addTransaction, openInExplorer } =
    useTransactionHistory<TransferRecord>();

  // 🚀 Transaction execution - handles all complexity
  const { execute, loading } = useLazorkitTransaction({
    gasless: true,
    successAlertTitle: "Transfer Sent! ✅",
    onSuccess: (signature) => {
      addTransaction(signature, { recipient, amount });
      setRecipient("");
      setAmount("");
    },
  });

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Not connected? Show the pre-built view
  if (!isConnected) {
    return <NotConnectedView />;
  }

  const handleTransfer = async () => {
    const recipientPubkey = validateAddress(recipient);
    if (!recipientPubkey) {
      Alert.alert("Error", "Invalid address");
      return;
    }

    const ix = createTransferInstruction(
      publicKey!,
      recipientPubkey,
      parseFloat(amount)
    );

    // Execute with the hook - loading, alerts, callbacks all handled!
    await execute({
      instructions: [ix],
      redirectPath: "transfer",
    });
  };

  return (
    <ScrollView>
      {/* Wallet address with copy */}
      <TouchableOpacity onPress={() => copy(address!)}>
        <Text>{address}</Text>
        <Text>{copied ? "✓ Copied!" : ""}</Text>
      </TouchableOpacity>

      {/* Form inputs... */}

      {/* Send button */}
      <Button
        title={loading ? "Sending..." : "Send SOL"}
        onPress={handleTransfer}
        disabled={loading}
      />

      {/* History */}
      {history.map((item) => (
        <TouchableOpacity
          key={item.id}
          onPress={() => openInExplorer(item.signature)}
        >
          <Text>{item.data.amount} SOL</Text>
          <Text>{item.formattedTime}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
```

---

## Best Practices

### 1. Keep Hooks Focused

```typescript
// ✅ Good - single responsibility
function useSolBalance() {
  /* only handles balance */
}
function useTokenBalance() {
  /* only handles tokens */
}

// ❌ Bad - too many responsibilities
function useEverything() {
  /* balance, tokens, history, staking... */
}
```

### 2. Provide Sensible Defaults

```typescript
// ✅ Good - works with no config
const { execute } = useLazorkitTransaction();

// Can be customized when needed
const { execute } = useLazorkitTransaction({
  gasless: true,
  successAlertTitle: "Custom title",
});
```

### 3. Return Derived Values

```typescript
// ✅ Good - computed values returned
return {
  balance,
  formattedBalance: balance?.toFixed(4) ?? "-.----",
  hasBalance: balance !== null && balance > 0,
};
```

### 4. Cleanup Resources

```typescript
// ✅ Good - cleanup on unmount
useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

### 5. Type Everything

```typescript
// ✅ Good - full TypeScript types
export interface UseLazorkitTransactionReturn {
  execute: (options: TransactionOptions) => Promise<string | null>;
  loading: boolean;
  error: Error | null;
}
```

---

## 🎉 What You've Learned

- ✅ Why custom hooks improve code quality
- ✅ Building `useLazorkitTransaction` for unified transactions
- ✅ Building `useWalletGuard` for connection checks
- ✅ Building `useSolBalance` with auto-refresh
- ✅ Building `useTransactionHistory` for tracking
- ✅ Building `useClipboard` with haptic feedback
- ✅ Composing hooks together for clean screens

---

## Next Steps

Continue to [Tutorial 4: SOL Staking](./04-SOL_STAKING.md) to learn how to build complex multi-instruction transactions for native Solana staking!
