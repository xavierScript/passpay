# Tutorial 3: Building Reusable Hooks

**Time to complete: 25-30 minutes**

Learn how to abstract LazorKit patterns into production-ready custom React hooks. These hooks reduce boilerplate, ensure consistency, and make your codebase maintainable.

---

## 📚 Table of Contents

1. [Why Custom Hooks?](#why-custom-hooks)
2. [Hook Architecture Overview](#hook-architecture-overview)
3. [Hook 1: useTransaction](#hook-1-usetransaction)
4. [Hook 2: useSolBalance](#hook-2-usesolbalance)
5. [Hook 3: useTransfer](#hook-3-usetransfer)
6. [Hook 4: useMemoHook](#hook-4-usememohook)
7. [Composing Hooks Together](#composing-hooks-together)
8. [Best Practices](#best-practices)

---

## Why Custom Hooks?

### The Problem: Repeated Boilerplate

Without custom hooks, every page has repeated code:

```typescript
// ❌ Without hooks - repeated in EVERY page
function TransferPage() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check connection (repeated everywhere)
  if (!isConnected) {
    return <NotConnectedView />;
  }

  const handleTransaction = async () => {
    setLoading(true);
    const toastId = toast.loading("Approve with passkey...");
    try {
      await signAndSendTransaction(/* ... */);
      toast.dismiss(toastId);
      toast.success("Success!");
    } catch (e) {
      toast.dismiss(toastId);
      setError(e.message);
      toast.error(e.message);
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
function TransferPage() {
  const { isConnected } = useWallet();
  const { transfer, loading, balance } = useTransfer();

  if (!isConnected) return <ConnectPrompt />;

  const handleTransfer = () => transfer(recipient, amount);

  return <Button onClick={handleTransfer} loading={loading} />;
}
```

### Benefits

| Without Hooks               | With Hooks                 |
| --------------------------- | -------------------------- |
| 100+ lines per page         | 30 lines per page          |
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

    Page Layer                      Hook Layer                  LazorKit SDK
         │                              │                            │
         │  useTransfer()               │                            │
         │─────────────────────────────>│  signAndSendTransaction()  │
         │                              │───────────────────────────>│
         │                              │                            │
         │  useSolBalance()             │  connection.getBalance()   │
         │─────────────────────────────>│───────────────────────────>│
         │                              │                            │
         │  useTransaction()            │  useWallet()               │
         │─────────────────────────────>│───────────────────────────>│
         │                              │                            │
         ▼                              ▼                            ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Pages import hooks      │  Hooks handle logic     │  SDK handles network   │
│  → Simple components     │  → State management     │  → Blockchain calls    │
│  → UI focused            │  → Error handling       │  → Signing             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hook 1: useTransaction

The core hook that abstracts all transaction handling.

### Implementation

```typescript
// hooks/useTransaction.ts
/**
 * useTransaction Hook
 *
 * Abstracts LazorKit transaction handling with:
 * - Automatic loading states
 * - Error handling with user-friendly messages
 * - Toast notifications
 */

import { useState, useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { TransactionInstruction } from "@solana/web3.js";
import toast from "react-hot-toast";

interface UseTransactionOptions {
  loadingMessage?: string;
  successMessage?: string;
}

interface UseTransactionReturn {
  execute: (instructions: TransactionInstruction[]) => Promise<string | null>;
  loading: boolean;
  signature: string | null;
  error: string | null;
}

/**
 * Parse transaction errors into user-friendly messages
 */
function parseTransactionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("NotAllowedError") || message.includes("cancelled")) {
    return "You cancelled the passkey prompt. Please try again.";
  }
  if (message.includes("Signing failed")) {
    return "Signing failed. Please ensure you're using HTTPS.";
  }
  if (message.includes("insufficient") || message.includes("Insufficient")) {
    return "Insufficient balance for this transaction.";
  }
  if (message.includes("Transaction too large")) {
    return "Transaction exceeds size limit. Try again with less data.";
  }
  if (message.includes("timeout")) {
    return "Request timed out. Please try again.";
  }

  return message || "Transaction failed. Please try again.";
}

export function useTransaction(
  options: UseTransactionOptions = {}
): UseTransactionReturn {
  const {
    loadingMessage = "Approve with your passkey...",
    successMessage = "Transaction successful! 🎉",
  } = options;

  const { signAndSendTransaction, isConnected, smartWalletPubkey } =
    useWallet();

  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (instructions: TransactionInstruction[]): Promise<string | null> => {
      // Validation
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      if (instructions.length === 0) {
        toast.error("No instructions provided");
        return null;
      }

      setLoading(true);
      setError(null);
      const toastId = toast.loading(loadingMessage);

      try {
        const sig = await signAndSendTransaction({
          instructions,
          transactionOptions: {
            feeToken: "USDC", // Gasless
          },
        });

        toast.dismiss(toastId);
        toast.success(successMessage);
        setSignature(sig);
        return sig;
      } catch (err) {
        toast.dismiss(toastId);
        const message = parseTransactionError(err);
        setError(message);
        toast.error(message);
        console.error("Transaction failed:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      isConnected,
      smartWalletPubkey,
      signAndSendTransaction,
      loadingMessage,
      successMessage,
    ]
  );

  return { execute, loading, signature, error };
}
```

### Usage

```typescript
const { execute, loading } = useTransaction({
  successMessage: "Transfer complete! 🎉",
});

const handleSend = async () => {
  const instruction = createTransferInstruction(from, to, amount);
  const sig = await execute([instruction]);
  if (sig) {
    // Success - sig is the transaction signature
  }
};
```

---

## Hook 2: useSolBalance

Manages SOL balance fetching with auto-refresh.

### Implementation

```typescript
// hooks/useSolBalance.ts
/**
 * useSolBalance Hook
 *
 * Fetches and manages SOL balance with:
 * - Auto-fetch on mount when connected
 * - Manual refresh capability
 * - Loading and error states
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useWallet } from "@lazorkit/wallet";
import { getSolBalance } from "@/lib/services/rpc";

interface UseSolBalanceOptions {
  autoFetch?: boolean;
}

interface UseSolBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

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
```

### Usage

```typescript
const { balance, loading, refresh } = useSolBalance();

return (
  <div>
    {loading ? "Loading..." : `${balance?.toFixed(4)} SOL`}
    <button onClick={refresh}>Refresh</button>
  </div>
);
```

---

## Hook 3: useTransfer

Composes `useTransaction` and `useSolBalance` for transfers.

### Implementation

```typescript
// hooks/useTransfer.ts
/**
 * useTransfer Hook
 *
 * Handles SOL transfers with:
 * - Input validation
 * - Balance checking
 * - Transaction execution
 * - Auto-refresh after transfer
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import {
  createTransferInstruction,
  validateAddress,
  validateAmount,
} from "@/lib/services/transfer";
import { useTransaction } from "./useTransaction";
import { useSolBalance } from "./useSolBalance";
import toast from "react-hot-toast";

interface UseTransferReturn {
  transfer: (recipient: string, amount: string) => Promise<string | null>;
  loading: boolean;
  balance: number | null;
  balanceLoading: boolean;
  refreshBalance: () => Promise<void>;
  error: string | null;
}

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
      // Check connection
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      // Validate recipient
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

      // Create instruction and execute
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

  return {
    transfer,
    loading,
    balance,
    balanceLoading,
    refreshBalance,
    error,
  };
}
```

### Usage

```typescript
const { transfer, loading, balance } = useTransfer();

const handleSend = async () => {
  const sig = await transfer(recipientAddress, "0.1");
  if (sig) {
    console.log("Transfer complete:", sig);
  }
};
```

---

## Hook 4: useMemoHook

Wraps memo instruction creation and execution.

### Implementation

```typescript
// hooks/useMemo.ts
/**
 * useMemoHook
 *
 * Handles on-chain memos with:
 * - Message validation
 * - Transaction execution
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { createMemoInstruction, validateMemo } from "@/lib/services/memo";
import { useTransaction } from "./useTransaction";
import toast from "react-hot-toast";

interface UseMemoReturn {
  writeMemo: (message: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

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

      // Create and execute
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
```

### Usage

```typescript
const { writeMemo, loading } = useMemoHook();

const handleSubmit = async () => {
  const sig = await writeMemo("Hello, Solana!");
  if (sig) {
    console.log("Memo stored:", sig);
  }
};
```

---

## Composing Hooks Together

### Hook Export Index

```typescript
// hooks/index.ts
/**
 * Central export for all hooks
 */

export { useTransaction } from "./useTransaction";
export { useSolBalance } from "./useSolBalance";
export { useTransfer } from "./useTransfer";
export { useMemoHook } from "./useMemo";
export { useStaking } from "./useStaking";
export { useSubscription } from "./useSubscription";
```

### Using Multiple Hooks

```typescript
// app/(dashboard)/transfer/page.tsx
"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useTransfer } from "@/hooks";

export default function TransferPage() {
  const { isConnected } = useWallet();
  const { transfer, loading, balance, balanceLoading } = useTransfer();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  if (!isConnected) {
    return <ConnectPrompt />;
  }

  const handleTransfer = async () => {
    const sig = await transfer(recipient, amount);
    if (sig) {
      setRecipient("");
      setAmount("");
    }
  };

  return (
    <div>
      <p>Balance: {balanceLoading ? "..." : `${balance?.toFixed(4)} SOL`}</p>

      <input value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} />

      <button onClick={handleTransfer} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
```

---

## Best Practices

### 1. Single Responsibility

Each hook should do one thing well:

```typescript
// ✅ Good - focused on balance
useSolBalance(); // Just fetches and manages balance

// ✅ Good - composes multiple concerns
useTransfer(); // Uses useSolBalance + useTransaction
```

### 2. Return Consistent Shapes

```typescript
// Standard pattern for all hooks
interface HookReturn {
  // Action function
  execute: (...) => Promise<Result>;

  // States
  loading: boolean;
  error: string | null;

  // Data (optional)
  data?: SomeType;
}
```

### 3. Handle Edge Cases

```typescript
// Always check connection
if (!isConnected || !smartWalletPubkey) {
  toast.error("Please connect your wallet");
  return null;
}

// Validate inputs
if (!amount || amount <= 0) {
  toast.error("Invalid amount");
  return null;
}
```

### 4. Provide User Feedback

```typescript
// Loading states
const toastId = toast.loading("Processing...");

// Success
toast.dismiss(toastId);
toast.success("Done!");

// Error
toast.dismiss(toastId);
toast.error(userFriendlyMessage);
```

### 5. Make Hooks Testable

```typescript
// Hooks with dependencies can be mocked
export function useTransfer() {
  const { execute } = useTransaction(); // Mockable
  const { balance } = useSolBalance(); // Mockable
  // ...
}
```

---

## Next Steps

Now that you understand hook patterns, continue with:

- [Tutorial 4: Native SOL Staking](./04-SOL_STAKING.md) - Complex multi-instruction transactions
- [Tutorial 5: On-Chain Memos](./05-ON_CHAIN_MEMOS.md) - Simple but powerful
