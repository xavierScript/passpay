# Tutorial 4: Native SOL Staking

**Time to complete: 30-35 minutes**

Learn how to implement native Solana staking with LazorKit. This advanced tutorial covers multi-instruction transactions, stake account creation, and working with Solana's Stake Program.

---

## 📚 Table of Contents

1. [Understanding Solana Staking](#understanding-solana-staking)
2. [The Challenge with LazorKit](#the-challenge-with-lazorkit)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create the Staking Service](#step-1-create-the-staking-service)
5. [Step 2: Build the useStaking Hook](#step-2-build-the-usestaking-hook)
6. [Step 3: Create the Staking Page](#step-3-create-the-staking-page)
7. [Step 4: Display Stake Accounts](#step-4-display-stake-accounts)
8. [Complete Code Example](#complete-code-example)
9. [Advanced Topics](#advanced-topics)
10. [Testing Your Implementation](#testing-your-implementation)

---

## Understanding Solana Staking

### What is Staking?

Staking is the process of locking up your SOL to support the Solana network and earn rewards.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SOLANA STAKING FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

    Your Wallet              Stake Account             Validator
         │                        │                        │
         │ 1. Create stake acct   │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │ 2. Delegate to         │                        │
         │    validator           │───────────────────────>│
         │                        │                        │
         │                        │ 3. Earn rewards        │
         │                        │<───────────────────────│
         │                        │                        │
         │ 4. Deactivate          │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │ 5. Withdraw            │                        │
         │<───────────────────────│                        │
         ▼                        ▼                        ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Stake Lifecycle:  INACTIVE → ACTIVATING → ACTIVE → DEACTIVATING → INACTIVE │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept           | Description                                             |
| ----------------- | ------------------------------------------------------- |
| **Stake Account** | A special account that holds staked SOL                 |
| **Validator**     | A node that processes transactions and earns rewards    |
| **Delegation**    | Assigning your stake to a specific validator            |
| **Epoch**         | ~2 days on mainnet; stake changes take effect per-epoch |
| **Rent**          | Small SOL amount to keep the stake account alive        |

---

## The Challenge with LazorKit

### The Problem

Traditional staking requires **two signers**:

1. Your wallet (to pay for the stake)
2. A new keypair (for the stake account)

But LazorKit only provides **one signer** (your passkey).

### The Solution: `createAccountWithSeed`

Instead of generating a new keypair, we derive the stake account address from:

- Your wallet's public key (the base)
- A unique seed string (e.g., `"stake:1703012345678"`)
- The Stake Program ID

```typescript
// Address is derived, not random!
const stakeAccountPubkey = await PublicKey.createWithSeed(
  walletPubkey, // Base: your wallet
  "stake:12345", // Seed: unique string
  StakeProgram.programId // Program
);

// Result: Deterministic address, no extra signer needed!
```

_Listing 4-1: Deriving a stake account address without a keypair_

This code demonstrates the key insight that makes staking work with LazorKit. The `createWithSeed` function derives an address deterministically from three inputs:

```typescript
walletPubkey,  // Base: your wallet
```

Your wallet's public key serves as the "base" for derivation. This ties the stake account to your wallet cryptographically.

```typescript
"stake:12345",  // Seed: unique string
```

The seed is an arbitrary string that makes each derived address unique. By including a timestamp (`stake:${Date.now()}`), we ensure each stake account gets a unique address.

```typescript
StakeProgram.programId; // Program
```

The program ID (the Stake Program's address) is included in the derivation. This ensures the derived address is valid for staking operations.

This approach:

- ✅ Works with LazorKit's single signer
- ✅ Creates unique accounts (timestamp in seed)
- ✅ Allows recovery (can regenerate addresses from seeds)

---

## Prerequisites

Before starting:

- ✅ Completed [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- ✅ Completed [Tutorial 3: Reusable Hooks](./03-REUSABLE_HOOKS.md)
- ✅ Have a connected wallet with 0.5+ SOL on Devnet
- ✅ Understand multi-instruction transactions

---

## Step 1: Create the Staking Service

Build a comprehensive staking service:

```typescript
// lib/services/staking.ts
/**
 * Native SOL Staking Service
 *
 * Uses createAccountWithSeed to work with LazorKit's single signer.
 */

import {
  Authorized,
  Connection,
  LAMPORTS_PER_SOL,
  Lockup,
  PublicKey,
  StakeProgram,
  TransactionInstruction,
} from "@solana/web3.js";

// Minimum stake amount (covers rent + buffer)
export const MIN_STAKE_AMOUNT = 0.01;

// Popular devnet validators
export const DEVNET_VALIDATORS = [
  {
    name: "Solana Foundation",
    identity: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
  },
  {
    name: "Devnet Validator 1",
    identity: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
    voteAccount: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
  },
  {
    name: "Devnet Validator 2",
    identity: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
    voteAccount: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
  },
];

export interface StakeAccountInfo {
  address: string;
  lamports: number;
  state: "inactive" | "activating" | "active" | "deactivating";
  validator?: string;
}

/**
 * Get the rent-exempt minimum for a stake account
 */
export async function getStakeAccountRent(
  connection: Connection
): Promise<number> {
  return await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
}

/**
 * Create instructions to create and delegate a stake account
 *
 * Uses createAccountWithSeed to avoid needing additional signers.
 */
export async function createStakeAccountInstructions(
  connection: Connection,
  fromPubkey: PublicKey,
  stakeAmount: number,
  validatorVoteAccount: PublicKey
): Promise<{
  instructions: TransactionInstruction[];
  stakeAccountPubkey: PublicKey;
  seed: string;
}> {
  const lamports = Math.floor(stakeAmount * LAMPORTS_PER_SOL);
  const rentExempt = await getStakeAccountRent(connection);

  // Use timestamp-based seed for uniqueness
  const seed = `stake:${Date.now()}`;

  // Derive stake account address (no additional signer needed!)
```

_Listing 4-2: The staking service structure with constants and helpers_

Let's examine the key parts of this service:

```typescript
export const MIN_STAKE_AMOUNT = 0.01;
```

Solana requires a minimum stake amount to cover "rent"—a small SOL deposit that keeps the account alive. We set a reasonable minimum that includes a buffer above the rent-exempt threshold.

```typescript
export const DEVNET_VALIDATORS = [
  {
    name: "Solana Foundation",
    identity: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
  },
  // ...
];
```

We hardcode a list of reliable Devnet validators. In production, you'd fetch this list dynamically or let users choose from a validator registry. The `voteAccount` is what we delegate to.

```typescript
export async function getStakeAccountRent(
  connection: Connection
): Promise<number> {
  return await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
}
```

This function queries the network for the current rent-exempt minimum for a stake account. The `StakeProgram.space` constant (200 bytes) tells the network how large the account will be.

```typescript
const seed = `stake:${Date.now()}`;
```

The timestamp-based seed ensures each stake account gets a unique address. If you wanted to find all stake accounts later, you could iterate through possible seeds—though querying the Stake Program directly is more practical.

```typescript
  const stakeAccountPubkey = await PublicKey.createWithSeed(
    fromPubkey,
    seed,
    StakeProgram.programId
  );

  const instructions: TransactionInstruction[] = [];

  // 1. Create stake account with seed
  const createAccountInstruction = StakeProgram.createAccountWithSeed({
    fromPubkey,
    stakePubkey: stakeAccountPubkey,
    basePubkey: fromPubkey,
    seed,
    authorized: new Authorized(fromPubkey, fromPubkey),
    lockup: new Lockup(0, 0, fromPubkey), // No lockup
    lamports: lamports + rentExempt,
  });

  instructions.push(...createAccountInstruction.instructions);

  // 2. Delegate stake to validator
  const delegateInstruction = StakeProgram.delegate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey: fromPubkey,
    votePubkey: validatorVoteAccount,
  });

  instructions.push(...delegateInstruction.instructions);

  return {
    instructions,
    stakeAccountPubkey,
    seed,
  };
}
```

_Listing 4-3: Creating stake account and delegation instructions_

This is the core staking logic. Let's examine each part:

```typescript
const stakeAccountPubkey = await PublicKey.createWithSeed(
  fromPubkey,
  seed,
  StakeProgram.programId
);
```

We derive the stake account's address deterministically. Given the same inputs, this always produces the same address—no randomness involved.

```typescript
const createAccountInstruction = StakeProgram.createAccountWithSeed({
  fromPubkey,
  stakePubkey: stakeAccountPubkey,
  basePubkey: fromPubkey,
  seed,
  authorized: new Authorized(fromPubkey, fromPubkey),
  lockup: new Lockup(0, 0, fromPubkey),
  lamports: lamports + rentExempt,
});
```

The `createAccountWithSeed` instruction does several things atomically:

- Creates the account at the derived address
- Sets the owner to the Stake Program
- Initializes stake authorities (staker and withdrawer)
- Funds it with the stake amount plus rent

The `Authorized` object sets who can manage the stake:

- First parameter: the "staker" who can delegate/undelegate
- Second parameter: the "withdrawer" who can withdraw funds

The `Lockup` with all zeros means no time-based restrictions—the stake can be withdrawn after deactivation completes.

```typescript
const delegateInstruction = StakeProgram.delegate({
  stakePubkey: stakeAccountPubkey,
  authorizedPubkey: fromPubkey,
  votePubkey: validatorVoteAccount,
});
```

The delegation instruction tells the stake account which validator to support. This must be signed by the "staker" authority set above.

```typescript
instructions.push(...createAccountInstruction.instructions);
```

Note the spread operator—`StakeProgram.createAccountWithSeed` returns multiple instructions bundled together. We spread them into our array to flatten the structure.

```typescript
/**
 * Get all stake accounts owned by a wallet
 */
export async function getStakeAccounts(
  connection: Connection,
  owner: PublicKey
): Promise<StakeAccountInfo[]> {
  try {
    const accounts = await connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [
          { dataSize: 200 },
          {
            memcmp: {
              offset: 12,
              bytes: owner.toBase58(),
            },
          },
        ],
      }
    );

    return accounts.map((account) => {
      const data = account.account.data as any;
      const parsed = data.parsed?.info;

      let state: StakeAccountInfo["state"] = "inactive";
      if (parsed?.stake?.delegation) {
        const activation = parsed.stake.delegation.activationEpoch;
        const deactivation = parsed.stake.delegation.deactivationEpoch;

        if (deactivation !== "18446744073709551615") {
          state = "deactivating";
        } else if (activation !== "18446744073709551615") {
          state = "active";
        }
      }

      return {
        address: account.pubkey.toBase58(),
        lamports: account.account.lamports,
        state,
        validator: parsed?.stake?.delegation?.voter,
      };
    });
  } catch (error) {
    console.error("Error fetching stake accounts:", error);
    return [];
  }
}
```

---

## Step 2: Build the useStaking Hook

```typescript
// hooks/useStaking.ts
/**
 * useStaking Hook
 *
 * Handles SOL staking operations with LazorKit.
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
  stake: (
    amount: string,
    validatorVoteAccount: string
  ) => Promise<string | null>;
  staking: boolean;
  balance: number | null;
  stakeAccounts: StakeAccountInfo[];
  loading: boolean;
  refresh: () => Promise<void>;
  error: string | null;
}

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

  // Auto-fetch on mount
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

        if (sig) {
          // Refresh after successful stake
          setTimeout(refresh, 2000);
        }

        return sig;
      } catch (err) {
        console.error("Staking error:", err);
        toast.error("Failed to create stake account");
        return null;
      }
    },
    [isConnected, smartWalletPubkey, balance, execute, getConnection, refresh]
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
```

---

## Step 3: Create the Staking Page

```typescript
// app/(dashboard)/staking/page.tsx
"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useStaking } from "@/hooks";
import { DEVNET_VALIDATORS, MIN_STAKE_AMOUNT } from "@/lib/services/staking";

export default function StakingPage() {
  const { isConnected } = useWallet();
  const { stake, staking, balance, stakeAccounts, loading, refresh } =
    useStaking();

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState("");

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

  const handleStake = async () => {
    const sig = await stake(amount, selectedValidator);
    if (sig) {
      setAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Stake SOL</h1>
        <p className="text-gray-400 mb-8">
          Earn rewards by staking to validators
        </p>

        {/* Balance Card */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-white">
                {loading ? "..." : `${balance?.toFixed(4) || "0"} SOL`}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Staking Form */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">New Stake</h2>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Amount (min {MIN_STAKE_AMOUNT} SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              min={MIN_STAKE_AMOUNT}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 
                         rounded-xl text-white focus:border-[#9945FF] focus:outline-none"
            />
          </div>

          {/* Validator Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Select Validator
            </label>
            <div className="space-y-2">
              {DEVNET_VALIDATORS.map((validator) => (
                <button
                  key={validator.voteAccount}
                  onClick={() => setSelectedValidator(validator.voteAccount)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    selectedValidator === validator.voteAccount
                      ? "border-[#9945FF] bg-[#9945FF]/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <p className="font-medium text-white">{validator.name}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    {validator.voteAccount.slice(0, 8)}...
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Stake Button */}
          <button
            onClick={handleStake}
            disabled={staking || !amount || !selectedValidator}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] 
                       disabled:opacity-50 text-white font-semibold rounded-xl"
          >
            {staking ? "Staking..." : "Stake SOL"}
          </button>
        </div>

        {/* Existing Stake Accounts */}
        {stakeAccounts.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Stake Accounts ({stakeAccounts.length})
            </h2>
            <div className="space-y-3">
              {stakeAccounts.map((account) => (
                <div
                  key={account.address}
                  className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-sm text-gray-400">
                        {account.address.slice(0, 8)}...
                        {account.address.slice(-8)}
                      </p>
                      <p className="text-white font-semibold">
                        {(account.lamports / 1e9).toFixed(4)} SOL
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        account.state === "active"
                          ? "bg-green-500/20 text-green-400"
                          : account.state === "activating"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {account.state}
                    </span>
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

## Step 4: Display Stake Accounts

### Understanding Stake States

| State          | Description                         |
| -------------- | ----------------------------------- |
| `inactive`     | Not yet delegated                   |
| `activating`   | Delegated, waiting for epoch change |
| `active`       | Earning rewards                     |
| `deactivating` | Unstaking, waiting for epoch change |

### Stake Account Card Component

```typescript
// components/StakeAccountCard.tsx
import { StakeAccountInfo } from "@/lib/services/staking";

interface Props {
  account: StakeAccountInfo;
}

export function StakeAccountCard({ account }: Props) {
  const stateColors = {
    inactive: "bg-gray-500/20 text-gray-400",
    activating: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    deactivating: "bg-orange-500/20 text-orange-400",
  };

  return (
    <div className="p-4 bg-[#0a0a0a] rounded-lg border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-mono text-sm text-gray-400">
            {account.address.slice(0, 8)}...{account.address.slice(-8)}
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {(account.lamports / 1e9).toFixed(4)} SOL
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            stateColors[account.state]
          }`}
        >
          {account.state}
        </span>
      </div>

      {account.validator && (
        <p className="text-xs text-gray-500">
          Validator: {account.validator.slice(0, 8)}...
        </p>
      )}

      <a
        href={`https://solscan.io/account/${account.address}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#9945FF] hover:underline mt-2 inline-block"
      >
        View on Explorer →
      </a>
    </div>
  );
}
```

---

## Complete Code Example

See the full implementation in the PassPay Web codebase:

- [lib/services/staking.ts](../../lib/services/staking.ts) - Service layer
- [hooks/useStaking.ts](../../hooks/useStaking.ts) - Hook layer
- [app/(dashboard)/staking/page.tsx](<../../app/(dashboard)/staking/page.tsx>) - UI layer

---

## Advanced Topics

### Deactivating Stakes

```typescript
export async function createDeactivateInstructions(
  stakeAccountPubkey: PublicKey,
  authorizedPubkey: PublicKey
): Promise<TransactionInstruction[]> {
  const instruction = StakeProgram.deactivate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey,
  });

  return instruction.instructions;
}
```

### Withdrawing Stakes

```typescript
export async function createWithdrawInstructions(
  connection: Connection,
  stakeAccountPubkey: PublicKey,
  toPubkey: PublicKey,
  authorizedPubkey: PublicKey
): Promise<TransactionInstruction[]> {
  const stakeBalance = await connection.getBalance(stakeAccountPubkey);

  const instruction = StakeProgram.withdraw({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey,
    toPubkey,
    lamports: stakeBalance,
  });

  return instruction.instructions;
}
```

---

## Testing Your Implementation

### Manual Testing

1. **Get Devnet SOL** - You need at least 0.5 SOL
2. **Select a validator** from the list
3. **Enter stake amount** (at least 0.01 SOL)
4. **Click "Stake SOL"** and approve with passkey
5. **Verify stake account** appears in the list
6. **Check on Solscan** - State should be "activating"

### Verify the Transaction

The transaction should contain:

1. `StakeProgram.createAccountWithSeed` instruction
2. `StakeProgram.delegate` instruction

Both in a single atomic transaction!

---

## Next Steps

Now that you can stake SOL, continue with:

- [Tutorial 5: On-Chain Memos](./05-ON_CHAIN_MEMOS.md) - Simpler transaction type
- [Tutorial 6: Subscription Payments](./06-SUBSCRIPTION_PAYMENTS.md) - Recurring payments
