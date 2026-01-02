# Tutorial 5: On-Chain Memos

**Time to complete: 15-20 minutes**

Learn how to write permanent messages to the Solana blockchain using the Memo Program. This beginner-friendly tutorial covers memo creation, validation, and building a simple on-chain messaging feature.

---

## 📚 Table of Contents

1. [What are On-Chain Memos?](#what-are-on-chain-memos)
2. [Use Cases](#use-cases)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create the Memo Service](#step-1-create-the-memo-service)
5. [Step 2: Build the useMemo Hook](#step-2-build-the-usememo-hook)
6. [Step 3: Create the Memo Page](#step-3-create-the-memo-page)
7. [Complete Code Example](#complete-code-example)
8. [Viewing Memos on Explorer](#viewing-memos-on-explorer)
9. [Testing Your Implementation](#testing-your-implementation)

---

## What are On-Chain Memos?

The Memo Program allows you to attach arbitrary text to Solana transactions. Once confirmed, these messages become permanent, immutable records on the blockchain.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MEMO TRANSACTION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

    Your App                Memo Program              Solana Blockchain
        │                        │                           │
        │  1. Create memo        │                           │
        │     instruction        │                           │
        │───────────────────────>│                           │
        │                        │                           │
        │                        │  2. Write to              │
        │                        │     transaction log       │
        │                        │──────────────────────────>│
        │                        │                           │
        │  3. Confirm            │                           │
        │<───────────────────────────────────────────────────│
        │                        │                           │
        ▼                        ▼                           ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Result: Memo permanently stored in transaction log, viewable on explorers  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Feature          | Description                                |
| ---------------- | ------------------------------------------ |
| **Permanence**   | Memos are stored forever                   |
| **Immutability** | Once written, cannot be changed or deleted |
| **Size Limit**   | Maximum 566 bytes (UTF-8 encoded)          |
| **Cost**         | Minimal (just transaction fee)             |
| **Visibility**   | Public on block explorers                  |

---

## Use Cases

- 📝 **Transaction notes** - Add context to payments
- 🏷️ **Tagging** - Label transactions for accounting
- 📜 **Proof of existence** - Timestamp documents
- 💬 **On-chain messaging** - Simple communication
- 🎭 **NFT metadata** - Store additional data
- 📊 **Audit trails** - Compliance records

---

## Prerequisites

Before starting:

- ✅ Completed [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- ✅ Have a connected wallet
- ✅ Basic understanding of transaction instructions

---

## Step 1: Create the Memo Service

```typescript
// lib/services/memo.ts
/**
 * Memo Service
 *
 * Creates instructions for writing on-chain memos.
 */

import { PublicKey, TransactionInstruction } from "@solana/web3.js";

// Official SPL Memo Program ID
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Maximum memo size in bytes
export const MAX_MEMO_SIZE = 566;

/**
 * Validate a memo string
 */
export function validateMemo(memo: string): { valid: boolean; error?: string } {
  if (!memo || memo.trim().length === 0) {
    return { valid: false, error: "Memo cannot be empty" };
  }

  // Check UTF-8 encoded size
  const encoder = new TextEncoder();
  const encoded = encoder.encode(memo);

  if (encoded.length > MAX_MEMO_SIZE) {
    return {
      valid: false,
      error: `Memo too long (${encoded.length}/${MAX_MEMO_SIZE} bytes)`,
    };
  }

  return { valid: true };
}

/**
 * Create a memo instruction
 *
 * @param memo - The message to write on-chain
 * @param signerPubkeys - Array of pubkeys that must sign (for verification)
 * @returns TransactionInstruction for the memo
 */
export function createMemoInstruction(
  memo: string,
  signerPubkeys: PublicKey[] = []
): TransactionInstruction {
  const validation = validateMemo(memo);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return new TransactionInstruction({
    keys: signerPubkeys.map((pubkey) => ({
      pubkey,
      isSigner: true,
      isWritable: false,
    })),
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf-8"),
  });
}

/**
 * Get character and byte count for a memo
 */
export function getMemoStats(memo: string): {
  characters: number;
  bytes: number;
  remaining: number;
} {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(memo).length;

  return {
    characters: memo.length,
    bytes,
    remaining: MAX_MEMO_SIZE - bytes,
  };
}
```

---

## Step 2: Build the useMemo Hook

```typescript
// hooks/useMemo.ts
/**
 * useMemo Hook (renamed to avoid conflict with React.useMemo)
 *
 * Handles writing memos to the blockchain.
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { createMemoInstruction, validateMemo } from "@/lib/services/memo";
import { useTransaction } from "./useTransaction";
import toast from "react-hot-toast";

interface UseMemoHookReturn {
  writeMemo: (memo: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export function useMemoHook(): UseMemoHookReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { execute, loading, error } = useTransaction({
    successMessage: "Memo written to blockchain! 📝",
  });

  const writeMemo = useCallback(
    async (memo: string): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      const validation = validateMemo(memo);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid memo");
        return null;
      }

      try {
        // Create memo instruction with signer for verification
        const memoInstruction = createMemoInstruction(memo, [
          smartWalletPubkey,
        ]);

        // Execute the transaction
        return await execute([memoInstruction]);
      } catch (err) {
        console.error("Memo error:", err);
        return null;
      }
    },
    [isConnected, smartWalletPubkey, execute]
  );

  return {
    writeMemo,
    loading,
    error,
  };
}
```

---

## Step 3: Create the Memo Page

```typescript
// app/(dashboard)/memo/page.tsx
"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useMemoHook } from "@/hooks";
import { getMemoStats, MAX_MEMO_SIZE } from "@/lib/services/memo";

export default function MemoPage() {
  const { isConnected } = useWallet();
  const { writeMemo, loading } = useMemoHook();

  const [memo, setMemo] = useState("");
  const [recentMemos, setRecentMemos] = useState<
    Array<{ text: string; signature: string; timestamp: Date }>
  >([]);

  const stats = getMemoStats(memo);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Wallet not connected</p>
          <a href="/login" className="text-[#9945FF] hover:underline">
            Connect Wallet →
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    const signature = await writeMemo(memo);
    if (signature) {
      setRecentMemos((prev) => [
        { text: memo, signature, timestamp: new Date() },
        ...prev,
      ]);
      setMemo("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">On-Chain Memo</h1>
        <p className="text-gray-400 mb-8">
          Write a permanent message to the Solana blockchain
        </p>

        {/* Memo Form */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <label className="block text-sm text-gray-400 mb-2">
            Your Message
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Enter your message..."
            rows={4}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 
                       rounded-xl text-white resize-none focus:border-[#9945FF] 
                       focus:outline-none"
          />

          {/* Character Counter */}
          <div className="flex justify-between items-center mt-2 mb-4">
            <span className="text-xs text-gray-500">
              {stats.characters} characters, {stats.bytes} bytes
            </span>
            <span
              className={`text-xs ${
                stats.remaining < 50 ? "text-yellow-500" : "text-gray-500"
              }`}
            >
              {stats.remaining} bytes remaining
            </span>
          </div>

          {/* Byte Limit Warning */}
          {stats.remaining < 0 && (
            <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg mb-4">
              ⚠️ Memo exceeds maximum size ({MAX_MEMO_SIZE} bytes)
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !memo.trim() || stats.remaining < 0}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] 
                       disabled:opacity-50 text-white font-semibold rounded-xl"
          >
            {loading ? "Writing to blockchain..." : "Write Memo"}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-blue-400 font-medium mb-2">
            ℹ️ About On-Chain Memos
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Memos are stored permanently on Solana</li>
            <li>• Once written, they cannot be edited or deleted</li>
            <li>• Anyone can view memos on block explorers</li>
            <li>• Transaction fees are covered by paymaster</li>
          </ul>
        </div>

        {/* Recent Memos */}
        {recentMemos.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Recent Memos
            </h2>
            <div className="space-y-3">
              {recentMemos.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700"
                >
                  <p className="text-white mb-2">{item.text}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                    <a
                      href={`https://solscan.io/tx/${item.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#9945FF] hover:underline"
                    >
                      View on Solscan →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Complete Code Example

Here's a minimal, self-contained example:

```typescript
import { useWallet } from "@lazorkit/wallet";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export function MemoWriter() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [memo, setMemo] = useState("");

  const handleWrite = async () => {
    if (!isConnected || !smartWalletPubkey) return;

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: smartWalletPubkey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memo, "utf-8"),
    });

    const signature = await signAndSendTransaction([instruction]);
    console.log("Memo written:", signature);
  };

  return (
    <div>
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="Your message"
      />
      <button onClick={handleWrite}>Write Memo</button>
    </div>
  );
}
```

---

## Viewing Memos on Explorer

After writing a memo, you can view it on Solscan:

1. Click the "View on Solscan" link
2. Scroll to the "Instructions" section
3. Find "Memo" instruction
4. Your message appears in the "Instruction Data" field

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOLSCAN TRANSACTION VIEW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Signature: 4vJ7...abc123                                                    │
│  Status: ✅ Success                                                          │
│  Block: 234567890                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Instructions:                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  #1 Memo Program                                                       │  │
│  │  Program: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr                 │  │
│  │  Data: "Hello from PassPay! 🎉"                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Your Implementation

### Unit Tests

```typescript
// tests/services/memo.test.ts
import { describe, it, expect } from "vitest";
import {
  validateMemo,
  createMemoInstruction,
  getMemoStats,
  MEMO_PROGRAM_ID,
} from "@/lib/services/memo";

describe("Memo Service", () => {
  describe("validateMemo", () => {
    it("accepts valid memo", () => {
      const result = validateMemo("Hello, blockchain!");
      expect(result.valid).toBe(true);
    });

    it("rejects empty memo", () => {
      const result = validateMemo("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Memo cannot be empty");
    });

    it("rejects whitespace-only memo", () => {
      const result = validateMemo("   ");
      expect(result.valid).toBe(false);
    });

    it("rejects oversized memo", () => {
      const longMemo = "x".repeat(600);
      const result = validateMemo(longMemo);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });
  });

  describe("createMemoInstruction", () => {
    it("creates valid instruction", () => {
      const instruction = createMemoInstruction("Test memo");
      expect(instruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true);
      expect(instruction.data.toString()).toBe("Test memo");
    });

    it("throws on empty memo", () => {
      expect(() => createMemoInstruction("")).toThrow();
    });
  });

  describe("getMemoStats", () => {
    it("counts ASCII correctly", () => {
      const stats = getMemoStats("Hello");
      expect(stats.characters).toBe(5);
      expect(stats.bytes).toBe(5);
    });

    it("counts Unicode correctly", () => {
      const stats = getMemoStats("🎉");
      expect(stats.characters).toBe(2); // Emoji is 2 JS characters
      expect(stats.bytes).toBe(4); // But 4 UTF-8 bytes
    });
  });
});
```

### Manual Testing

1. **Enter a short message** - "Hello, Solana!"
2. **Click "Write Memo"** - Approve with passkey
3. **Wait for confirmation** - Toast appears
4. **View on Solscan** - Click the link
5. **Find your memo** - In the Instructions section

---

## Next Steps

Now that you can write on-chain memos, continue with:

- [Tutorial 6: Subscription Payments](./06-SUBSCRIPTION_PAYMENTS.md) - Recurring payment flows
- [API Reference](../API_REFERENCE.md) - Full hook documentation
