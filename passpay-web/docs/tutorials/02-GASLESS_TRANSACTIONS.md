# Tutorial 2: Gasless Transactions

**Time to complete: 20-25 minutes**

Learn how to send SOL transactions without requiring users to pay gas fees. LazorKit's paymaster service sponsors transaction fees, creating a seamless user experience.

---

## 📚 Table of Contents

1. [What are Gasless Transactions?](#what-are-gasless-transactions)
2. [How the Paymaster Works](#how-the-paymaster-works)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create Transfer Service](#step-1-create-transfer-service)
5. [Step 2: Build the Transfer Page](#step-2-build-the-transfer-page)
6. [Step 3: Implement signAndSendTransaction](#step-3-implement-signandsendtransaction)
7. [Complete Code Example](#complete-code-example)
8. [Testing Your Implementation](#testing-your-implementation)

---

## What are Gasless Transactions?

### The Problem with Traditional Crypto

```
Traditional Solana Transaction:
┌─────────────────────────────────────────┐
│ User wants to send 1 SOL               │
├─────────────────────────────────────────┤
│ ❌ But wait! You need SOL for gas fees  │
│ ❌ New users must buy SOL first         │
│ ❌ Terrible onboarding experience       │
└─────────────────────────────────────────┘
```

### The LazorKit Solution

```
Gasless Transaction with LazorKit:
┌─────────────────────────────────────────┐
│ User wants to send 1 SOL               │
├─────────────────────────────────────────┤
│ ✅ Paymaster pays the gas fee           │
│ ✅ User just sends what they want       │
│ ✅ Perfect for new users                │
└─────────────────────────────────────────┘
```

### Comparison

| Aspect                   | Traditional    | Gasless (LazorKit) |
| ------------------------ | -------------- | ------------------ |
| Gas paid by              | User           | Paymaster          |
| User needs SOL for fees  | Yes            | No                 |
| Extra step for new users | Buy SOL first  | None               |
| Transaction complexity   | User sees fees | Abstracted away    |

---

## How the Paymaster Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GASLESS TRANSACTION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

    Your App              LazorKit Portal           Paymaster            Solana
       │                        │                      │                   │
       │ 1. Create instruction  │                      │                   │
       │   (e.g., SOL transfer) │                      │                   │
       │                        │                      │                   │
       │ 2. signAndSendTx()     │                      │                   │
       │───────────────────────>│                      │                   │
       │                        │                      │                   │
       │                        │ 3. Request signature │                   │
       │                        │   (WebAuthn prompt)  │                   │
       │                        │                      │                   │
       │                        │ 4. Build transaction │                   │
       │                        │───────────────────────>                   │
       │                        │                      │                   │
       │                        │                      │ 5. Sponsor fee    │
       │                        │                      │   (paymaster pays)│
       │                        │                      │                   │
       │                        │                      │ 6. Submit to      │
       │                        │                      │   Solana network  │
       │                        │                      │──────────────────>│
       │                        │                      │                   │
       │ 7. Return signature    │                      │                   │
       │<───────────────────────│                      │                   │
       ▼                        ▼                      ▼                   ▼
```

### Key Insight

The user only signs with their passkey. The paymaster adds the fee payment and submits the final transaction.

---

## Prerequisites

Before starting this tutorial:

- ✅ Completed [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md)
- ✅ Have a connected wallet with some Devnet SOL
- ✅ Understand basic React and TypeScript

### Get Devnet SOL

You'll need some SOL to test transfers. To get free Devnet SOL:

1. Copy your wallet address from the app
2. Visit [solfaucet.com](https://solfaucet.com/) or [faucet.solana.com](https://faucet.solana.com/)
3. Paste your address and request SOL

---

## Step 1: Create Transfer Service

First, create a service to handle transfer logic:

```typescript
// lib/services/transfer.ts
/**
 * SOL Transfer Service
 *
 * Handles creating transfer instructions for sending SOL between wallets.
 * Used with LazorKit's paymaster for gasless transactions.
 */

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * Validate a Solana address and return the PublicKey
 * @param address - The address string to validate
 * @returns The PublicKey if valid, null if invalid
 */
export function validateAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

/**
 * Validate transfer amount
 * @param amount - The amount string to validate
 * @param minAmount - Minimum amount allowed (default 0)
 * @returns The parsed amount if valid, null if invalid
 */
export function validateAmount(
  amount: string,
  minAmount: number = 0
): number | null {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= minAmount) {
    return null;
  }
  return parsed;
}

/**
 * Create a SOL transfer instruction
 *
 * This creates the instruction - it doesn't send anything yet.
 * The instruction tells Solana: "Move X lamports from A to B"
 */
export function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    // Convert SOL to lamports (1 SOL = 1 billion lamports)
    lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
  });
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
```

_Listing 2-1: The transfer service with validation and instruction creation helpers_

This service module provides the building blocks for SOL transfers. Let's examine each function:

```typescript
export function validateAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}
```

Solana addresses are Base58-encoded strings. The `PublicKey` constructor validates the format—if the string isn't a valid Solana address, it throws an error. We catch that error and return `null` instead, making it easy to check validity with a simple `if (validateAddress(input))` pattern. Let's look at the next instruction:

```typescript
export function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
  });
}
```

This function creates a _transfer instruction_, not a transaction. Think of an instruction as a single command—"transfer X lamports from A to B". A transaction is an envelope that can contain multiple instructions.

Note:
The `LAMPORTS_PER_SOL` constant (which is 1 billion) converts human-readable SOL amounts to lamports, Solana's smallest unit. We use `Math.floor()` to ensure we're working with whole lamports, avoiding floating-point precision issues. 1 SOL = 1,000,000,000 Lamports.

## Step 2: Build the Transfer Page

Create the transfer page UI:

```typescript
// app/(dashboard)/transfer/page.tsx
"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useSolBalance } from "@/hooks"; // Custom hook to fetch and track SOL balance
import toast from "react-hot-toast";

export default function TransferPage() {
  const { isConnected, smartWalletPubkey, signAndSendTransaction } =
    useWallet();
  const { balance, loading: balanceLoading, refresh } = useSolBalance();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Show connect prompt if not connected
  if (!isConnected || !smartWalletPubkey) {
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

  // We'll implement handleTransfer next...
  const handleTransfer = async () => {
    /* ... */
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Send SOL</h1>
        <p className="text-gray-400 mb-8">
          Gasless transfers powered by LazorKit
        </p>

        {/* Balance Display */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-white">
            {balanceLoading ? "..." : `${balance?.toFixed(4) || "0"} SOL`}
          </p>
        </div>

        {/* Transfer Form */}
        <div className="space-y-4">
          {/* Recipient Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 
                         rounded-xl text-white placeholder-gray-500
                         focus:border-[#9945FF] focus:outline-none"
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.001"
              min="0"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 
                         rounded-xl text-white placeholder-gray-500
                         focus:border-[#9945FF] focus:outline-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleTransfer}
            disabled={loading || !recipient || !amount}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? "Sending..." : "Send SOL"}
          </button>

          {/* Info Note */}
          <p className="text-xs text-gray-500 text-center">
            ✨ Gas fees sponsored by LazorKit paymaster
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 3: Implement signAndSendTransaction

Now, add the transfer logic. First, import the helper functions we created in Step 1:

```typescript
import {
  validateAddress, // Validates and converts address string to PublicKey
  validateAmount, // Validates and parses the amount
  createTransferInstruction, // Creates the SOL transfer instruction
} from "@/lib/services/transfer";

const handleTransfer = async () => {
  // 1. Validate inputs
  const recipientPubkey = validateAddress(recipient);
  if (!recipientPubkey) {
    toast.error("Invalid recipient address");
    return;
  }

  const amountValue = validateAmount(amount, 0);
  if (!amountValue) {
    toast.error("Invalid amount. Must be greater than 0");
    return;
  }

  // 2. Check balance
  if (balance !== null && amountValue > balance) {
    toast.error(`Insufficient balance. You have ${balance.toFixed(4)} SOL`);
    return;
  }

  setLoading(true);
  const toastId = toast.loading("Approve with your passkey...");

  try {
    // 3. Create the transfer instruction
    const instruction = createTransferInstruction(
      smartWalletPubkey!, // From our wallet
      recipientPubkey, // To recipient
      amountValue // Amount in SOL
    );

    // 4. Sign and send with LazorKit
    const signature = await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: {
        feeToken: "USDC", // Gasless! Paymaster pays in USDC
      },
    });

    // 5. Success!
    toast.dismiss(toastId);
    toast.success("Transfer complete! 🎉");
    console.log("Transaction signature:", signature);

    // 6. Clear form and refresh balance
    setRecipient("");
    setAmount("");
    refresh();
  } catch (error) {
    toast.dismiss(toastId);
    const message = parseError(error);
    toast.error(message);
    console.error("Transfer failed:", error);
  } finally {
    setLoading(false);
  }
};
```

_Listing 2-2: The complete handleTransfer function with validation and transaction execution_

This function orchestrates the entire transfer flow. Let's examine each section:

```typescript
const recipientPubkey = validateAddress(recipient);
if (!recipientPubkey) {
  toast.error("Invalid recipient address");
  return;
}
```

Input validation happens first. We fail fast if the address or amount is invalid. This prevents unnecessary network calls and provides immediate feedback to users.

```typescript
const instruction = createTransferInstruction(
  smartWalletPubkey!,
  recipientPubkey,
  amountValue
);
```

We create the transfer instruction using our service function. The `!` after `smartWalletPubkey` is TypeScript's non-null assertion—we've already checked that the wallet is connected, so we're confident this value exists.

```typescript
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: "USDC",
  },
});
```

This is where the magic happens. `signAndSendTransaction` does several things:

1. Opens the LazorKit portal for passkey signing
2. User authenticates with their biometrics
3. Transaction is sent to the paymaster
4. Paymaster adds fee payment and submits to Solana
5. Returns the transaction signature

The `feeToken: "USDC"` option enables gasless transactions—the paymaster pays fees in USDC on behalf of the user.

```typescript
refresh();
```

After a successful transfer, we call `refresh()` from the `useSolBalance` hook to update the displayed balance. This ensures the UI reflects the new state immediately.

---

## Complete Code Example

```typescript
// app/(dashboard)/transfer/page.tsx
"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useSolBalance } from "@/hooks";
import {
  validateAddress,
  validateAmount,
  createTransferInstruction,
} from "@/lib/services/transfer";
import toast from "react-hot-toast";

export default function TransferPage() {
  const { isConnected, smartWalletPubkey, signAndSendTransaction } =
    useWallet();
  const { balance, loading: balanceLoading, refresh } = useSolBalance();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isConnected || !smartWalletPubkey) {
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

  const handleTransfer = async () => {
    const recipientPubkey = validateAddress(recipient);
    if (!recipientPubkey) {
      toast.error("Invalid recipient address");
      return;
    }

    const amountValue = validateAmount(amount, 0);
    if (!amountValue) {
      toast.error("Invalid amount");
      return;
    }

    if (balance !== null && amountValue > balance) {
      toast.error(`Insufficient balance. You have ${balance.toFixed(4)} SOL`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Approve with your passkey...");

    try {
      const instruction = createTransferInstruction(
        smartWalletPubkey,
        recipientPubkey,
        amountValue
      );

      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: { feeToken: "USDC" },
      });

      toast.dismiss(toastId);
      toast.success(
        <span>
          Transfer complete!{" "}
          <a
            href={`https://solscan.io/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View →
          </a>
        </span>
      );

      setRecipient("");
      setAmount("");
      refresh();
    } catch (error) {
      toast.dismiss(toastId);
      const msg = error instanceof Error ? error.message : "Transaction failed";
      if (msg.includes("NotAllowedError")) {
        toast.error("You cancelled the passkey prompt.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Send SOL</h1>
        <p className="text-gray-400 mb-8">
          Gasless transfers powered by LazorKit
        </p>

        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-white">
            {balanceLoading ? "..." : `${balance?.toFixed(4) || "0"} SOL`}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address..."
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 
                         rounded-xl text-white focus:border-[#9945FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.001"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 
                         rounded-xl text-white focus:border-[#9945FF] focus:outline-none"
            />
          </div>

          <button
            onClick={handleTransfer}
            disabled={loading || !recipient || !amount}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] 
                       disabled:opacity-50 text-white font-semibold rounded-xl"
          >
            {loading ? "Sending..." : "Send SOL"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            ✨ Gas fees sponsored by LazorKit paymaster
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Your Implementation

### Manual Testing

1. **Get Devnet SOL**

   - Copy your wallet address
   - Use [solfaucet.com](https://solfaucet.com/) to get free SOL

2. **Test Valid Transfer**

   - Enter a valid recipient address
   - Enter an amount less than your balance
   - Click "Send SOL"
   - Approve with passkey
   - Verify transaction on explorer

3. **Test Error Cases**
   - Invalid address → Should show error
   - Amount > balance → Should show insufficient balance
   - Cancel passkey prompt → Should show cancelled message

### Verify Gasless

Notice that:

- You didn't need SOL for gas fees
- The paymaster sponsored the transaction
- Your full amount was sent to the recipient

---

## Next Steps

Now that you can send gasless transactions, continue with:

- [Tutorial 3: Native SOL Staking](./03-SOL_STAKING.md) - Complex multi-instruction transactions
- [Tutorial 4: On-Chain Memos](./04-ON_CHAIN_MEMOS.md) - Store permanent messages on Solana
