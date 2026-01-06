# Tutorial 3: Native SOL Staking

**Time to complete: 30-35 minutes**

Learn how to implement native Solana staking with LazorKit. This advanced tutorial covers multi-instruction transactions, stake account creation, and working with Solana's Stake Program.

---

## 📚 Table of Contents

1. [Understanding Solana Staking](#understanding-solana-staking)
2. [The Challenge with LazorKit](#the-challenge-with-lazorkit)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create the Staking Service](#step-1-create-the-staking-service)
5. [Step 2: Build the Staking Screen](#step-2-build-the-staking-screen)
6. [Step 3: Implement Staking Logic](#step-3-implement-staking-logic)
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
  StakeProgram.programId
);

// Result: Deterministic address, no extra signer needed!
```

_Listing 3-1: Deriving a stake account address without generating a keypair_

This is the key insight that makes staking work with LazorKit. Let's understand what's happening:

```typescript
walletPubkey,  // Base: your wallet
```

Your wallet's public key serves as the "base" for address derivation. This cryptographically ties the stake account to your wallet.

```typescript
"stake:12345",  // Seed: unique string
```

The seed is an arbitrary string that makes each derived address unique. By using `stake:${Date.now()}`, we ensure every stake operation creates a unique account.

```typescript
StakeProgram.programId; // Program
```

Including the program ID ensures the derived address is valid for the Stake Program. Different programs with the same seed would produce different addresses.

This approach:

- ✅ Works with LazorKit's single signer
- ✅ Creates unique accounts (timestamp in seed)
- ✅ Allows recovery (can regenerate addresses from seeds)

---

## Prerequisites

Before starting:

- ✅ Completed [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- ✅ Have a connected wallet with 0.5+ SOL on Devnet
- ✅ Understand multi-instruction transactions

---

## Step 1: Create the Staking Service

Build a comprehensive staking service:

```typescript
// features/staking/services/staking.service.ts
/**
 * Native SOL Staking Service
 *
 * Handles staking SOL to validators using Solana's native Stake Program.
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
```

_Listing 3-2: Staking service constants, types, and helper functions_

This sets up the foundation for staking. Let's examine the key parts:

```typescript
export const MIN_STAKE_AMOUNT = 0.01;
```

Solana stake accounts need enough SOL to be "rent-exempt"—a small deposit that keeps the account alive. We set a minimum that covers this plus a buffer.

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

We hardcode reliable Devnet validators for testing. The `voteAccount` is the address we delegate to. In production, you'd fetch this list dynamically from a validator registry.

```typescript
export async function getStakeAccountRent(
  connection: Connection
): Promise<number> {
  return await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
}
```

This queries the network for the current rent-exempt minimum. The `StakeProgram.space` constant (200 bytes) tells the network the account size.

```typescript
/**
 * Create instructions to create and delegate a stake account
 *
 * This is the key function that makes staking work with LazorKit.
 * By using createAccountWithSeed, we avoid needing an additional signer.
 */
export async function createStakeAccountInstructions(
  connection: Connection,
  fromPubkey: PublicKey,
  stakeAmount: number, // in SOL
  validatorVoteAccount: PublicKey
): Promise<{
  instructions: TransactionInstruction[];
  stakeAccountPubkey: PublicKey;
  seed: string;
}> {
  // Convert SOL to lamports
  const lamports = stakeAmount * LAMPORTS_PER_SOL;

  // Get rent-exempt minimum
  const rentExempt = await getStakeAccountRent(connection);

  // ====================================================
  // STEP 1: Generate a unique seed using timestamp
  // ====================================================
  // The seed must be unique for each stake account
  // Using timestamp ensures uniqueness
  const seed = `stake:${Date.now()}`;

  // ====================================================
  // STEP 2: Derive stake account address from seed
  // ====================================================
  // This is deterministic! Same inputs = same output
  const stakeAccountPubkey = await PublicKey.createWithSeed(
    fromPubkey, // Base: your wallet
    seed, // Seed: unique string
    StakeProgram.programId // Program: Stake Program
  );
```

_Listing 3-3: The createStakeAccountInstructions function setup_

This function is the heart of the staking logic:

```typescript
const seed = `stake:${Date.now()}`;
```

The timestamp-based seed ensures each stake account gets a unique address. Even if you stake twice in the same second, the millisecond precision prevents collisions.

```typescript
const stakeAccountPubkey = await PublicKey.createWithSeed(
  fromPubkey,
  seed,
  StakeProgram.programId
);
```

Address derivation is _deterministic_—the same inputs always produce the same output. This means you could theoretically recover stake accounts by iterating through historical timestamps.

```typescript
  console.log("Creating stake account:");
  console.log("  Seed:", seed);
  console.log("  Address:", stakeAccountPubkey.toBase58());
  console.log("  Amount:", stakeAmount, "SOL");
  console.log("  Rent:", rentExempt / LAMPORTS_PER_SOL, "SOL");

  const instructions: TransactionInstruction[] = [];

  // ====================================================
  // STEP 3: Create the stake account with seed
  // ====================================================
  // This instruction creates the account and initializes it
  const createAccountInstruction = StakeProgram.createAccountWithSeed({
    fromPubkey, // Funds come from your wallet
    stakePubkey: stakeAccountPubkey, // The new stake account
    basePubkey: fromPubkey, // Base for seed derivation
    seed, // The unique seed
    authorized: new Authorized(
      fromPubkey, // Staker: who can delegate
      fromPubkey // Withdrawer: who can withdraw
    ),
    lockup: new Lockup(
      0, // Unlock timestamp (0 = no lockup)
      0, // Epoch (0 = no lockup)
      fromPubkey // Custodian
    ),
    lamports: lamports + rentExempt, // Stake + rent
  });

  // createAccountWithSeed returns multiple instructions
  instructions.push(...createAccountInstruction.instructions);

  // ====================================================
  // STEP 4: Delegate the stake to a validator
  // ====================================================
  const delegateInstruction = StakeProgram.delegate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey: fromPubkey, // Must be the staker authority
    votePubkey: validatorVoteAccount,
  });

  instructions.push(...delegateInstruction.instructions);

  console.log(`Created ${instructions.length} staking instructions`);

  return {
    instructions,
    stakeAccountPubkey,
    seed,
  };
}
```

_Listing 3-4: Creating and delegating the stake account_

Let's break down the critical parts:

```typescript
authorized: new Authorized(
  fromPubkey,  // Staker: who can delegate
  fromPubkey   // Withdrawer: who can withdraw
),
```

The `Authorized` object sets two authorities:

- **Staker**: Can delegate to validators and deactivate the stake
- **Withdrawer**: Can withdraw SOL after deactivation

We set both to your wallet address, giving you full control.

```typescript
lockup: new Lockup(0, 0, fromPubkey),
```

A lockup with zeros means no time restrictions. The stake can be deactivated and withdrawn at any time (subject to epoch boundaries).

```typescript
lamports: lamports + rentExempt,
```

We fund the account with both the stake amount AND the rent-exempt minimum. This ensures the account persists permanently.

```typescript
instructions.push(...createAccountInstruction.instructions);
```

Note the spread operator—`StakeProgram.createAccountWithSeed` returns an object containing an array of instructions. We spread them into our flat array.

/\*\*

- Get all stake accounts owned by a wallet
  \*/
  export async function getStakeAccounts(
  connection: Connection,
  walletPubkey: PublicKey
  ): Promise<StakeAccountInfo[]> {
  try {
  // Get all stake accounts where we're the withdrawer
  const accounts = await connection.getParsedProgramAccounts(
  StakeProgram.programId,
  {
  filters: [
  // Filter by stake account size
  { dataSize: 200 },
  // Filter by withdrawer (our wallet)
  {
  memcmp: {
  offset: 44, // Withdrawer pubkey offset
  bytes: walletPubkey.toBase58(),
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
          } else if (activation !== "0") {
            state = "active";
          } else {
            state = "activating";
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

/\*\*

- Create instruction to deactivate a stake account
  \*/
  export function createDeactivateInstruction(
  stakeAccountPubkey: PublicKey,
  authorizedPubkey: PublicKey
  ): TransactionInstruction[] {
  const deactivate = StakeProgram.deactivate({
  stakePubkey: stakeAccountPubkey,
  authorizedPubkey,
  });
  return deactivate.instructions;
  }

/\*\*

- Create instruction to withdraw from a deactivated stake account
  \*/
  export function createWithdrawInstruction(
  stakeAccountPubkey: PublicKey,
  withdrawerPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
  ): TransactionInstruction[] {
  const withdraw = StakeProgram.withdraw({
  stakePubkey: stakeAccountPubkey,
  authorizedPubkey: withdrawerPubkey,
  toPubkey,
  lamports,
  });
  return withdraw.instructions;
  }

```

### Understanding the Instructions

The staking transaction contains **multiple instructions** that execute atomically:

```

┌─────────────────────────────────────────────────────────────────────────────┐
│ STAKE TRANSACTION INSTRUCTIONS │
└─────────────────────────────────────────────────────────────────────────────┘

Instruction 1: CreateAccountWithSeed
├── Creates a new account at derived address
├── Funds it with stake amount + rent
└── Initializes as a stake account

Instruction 2: Initialize (included in CreateAccountWithSeed)
├── Sets the staker authority (who can delegate)
└── Sets the withdrawer authority (who can withdraw)

Instruction 3: Delegate
├── Assigns stake to a validator
└── Stake begins activating next epoch

All execute atomically: Either ALL succeed or NONE do.

---

## Step 2: Build the Staking Screen

Create the UI for staking:

```typescript
// app/(tabs)/stake.tsx
import { useWalletGuard, useLazorkitTransaction, useSolBalance } from "@/hooks";
import { getConnection } from "@/services/rpc";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  MIN_STAKE_AMOUNT,
  StakeAccountInfo,
} from "@/services/staking";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Static validators (avoid expensive RPC call)
const VALIDATORS = [
  {
    name: "Solana Foundation",
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
  },
  {
    name: "Devnet Validator",
    voteAccount: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
  },
];

export default function StakeScreen() {
  // Custom hooks for clean code
  const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
    icon: "🥩",
    message: "Connect wallet to stake SOL",
  });

  const {
    balance: solBalance,
    refresh: refreshBalance,
    refreshControl,
  } = useSolBalance();

  const { execute, loading: staking } = useLazorkitTransaction({
    successAlertTitle: "Staked Successfully! 🎉",
    onSuccess: () => {
      setAmount("");
      refreshBalance();
      fetchStakeAccounts();
    },
  });

  // Local state
  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string>(
    VALIDATORS[0].voteAccount
  );
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const connection = getConnection();

  // Fetch existing stake accounts
  const fetchStakeAccounts = useCallback(async () => {
    if (!publicKey) return;

    setLoadingAccounts(true);
    try {
      const accounts = await getStakeAccounts(connection, publicKey);
      setStakeAccounts(accounts);
    } catch (error) {
      console.error("Error fetching stake accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  }, [publicKey, connection]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      if (isConnected && publicKey) {
        fetchStakeAccounts();
      }
    }, [isConnected, publicKey, fetchStakeAccounts])
  );

  // Not connected state
  if (!isConnected) {
    return <NotConnectedView />;
  }

  // ... continue with handleStake and render
}
```

_Listing 3-6: Staking screen setup with hooks and state_`

---

## Step 3: Implement Staking Logic

Add the staking handler:

```typescript
const handleStake = async () => {
  // ====================================================
  // VALIDATION
  // ====================================================

  if (!publicKey) {
    Alert.alert("Error", "Please connect your wallet first");
    return;
  }

  const stakeAmount = parseFloat(amount);

  // Check minimum stake
  if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE_AMOUNT) {
    Alert.alert("Error", `Minimum stake amount is ${MIN_STAKE_AMOUNT} SOL`);
    return;
  }

  // Check balance (need stake + some for rent/fees)
  if (solBalance !== null && stakeAmount > solBalance - 0.01) {
    Alert.alert(
      "Insufficient Balance",
      `You need at least ${stakeAmount + 0.01} SOL (stake + rent)`
    );
    return;
  }

  if (!selectedValidator) {
    Alert.alert("Error", "Please select a validator");
    return;
  }

  // ====================================================
  // CREATE STAKE INSTRUCTIONS
  // ====================================================

  console.log("Creating stake account:", {
    amount: stakeAmount,
    validator: selectedValidator,
  });

  try {
    // Build the multi-instruction transaction
    const { instructions, stakeAccountPubkey, seed } =
      await createStakeAccountInstructions(
        connection,
        publicKey,
        stakeAmount,
        new PublicKey(selectedValidator)
      );

    console.log(`Created ${instructions.length} stake instructions`);
    console.log(`Stake account: ${stakeAccountPubkey.toBase58()}`);
    console.log(`Seed: ${seed}`);

    // ====================================================
    // EXECUTE WITH LAZORKIT
    // ====================================================

    // Note: We need more compute units for staking
    await execute({
      instructions,
      redirectPath: "stake",
      computeUnitLimit: 200_000, // Increase for complex tx
    });
  } catch (error: any) {
    console.error("Stake error:", error);
    Alert.alert(
      "Error",
      error?.message || "Failed to stake. Please try again."
    );
  }
};
```

---

## Step 4: Display Stake Accounts

Show existing stakes with status indicators:

```typescript
// Helper to format stake state
function getStateDisplay(state: StakeAccountInfo["state"]) {
  switch (state) {
    case "active":
      return { emoji: "✅", text: "Active", color: "#14F195" };
    case "activating":
      return { emoji: "⏳", text: "Activating", color: "#FFD700" };
    case "deactivating":
      return { emoji: "📤", text: "Deactivating", color: "#FF6B6B" };
    default:
      return { emoji: "⚪", text: "Inactive", color: "#888" };
  }
}

// Render stake accounts
{
  stakeAccounts.length > 0 && (
    <View style={styles.stakeAccountsSection}>
      <Text style={styles.sectionTitle}>Your Stake Accounts</Text>

      {stakeAccounts.map((account) => {
        const state = getStateDisplay(account.state);
        const solAmount = account.lamports / LAMPORTS_PER_SOL;

        return (
          <TouchableOpacity
            key={account.address}
            style={styles.stakeAccountCard}
            onPress={() => openExplorer(account.address)}
          >
            <View style={styles.stakeAccountHeader}>
              <Text style={styles.stakeAccountAmount}>
                {solAmount.toFixed(4)} SOL
              </Text>
              <View
                style={[
                  styles.stateBadge,
                  { backgroundColor: state.color + "20" },
                ]}
              >
                <Text style={[styles.stateText, { color: state.color }]}>
                  {state.emoji} {state.text}
                </Text>
              </View>
            </View>

            <Text style={styles.stakeAccountAddress}>
              {truncateAddress(account.address)}
            </Text>

            {account.validator && (
              <Text style={styles.validatorText}>
                Validator: {truncateAddress(account.validator)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

_Listing 3-8: Rendering stake accounts with state indicators_

---

## Complete Code Example

Here's the full staking screen from PassPay:

```typescript
// app/(tabs)/stake.tsx
import { AppColors } from "@/constants/theme";
import { useLazorkitTransaction, useSolBalance, useWalletGuard } from "@/hooks";
import { getConnection } from "@/services/rpc";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  MIN_STAKE_AMOUNT,
  StakeAccountInfo,
} from "@/services/staking";
import { truncateAddress, getAddressExplorerUrl } from "@/utils/helpers";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const VALIDATORS = [
  {
    name: "Solana Foundation",
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
  },
  {
    name: "Devnet Validator 1",
    voteAccount: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
  },
  {
    name: "Devnet Validator 2",
    voteAccount: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
  },
];

export default function StakeScreen() {
  const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
    icon: "🥩",
    message: "Connect wallet to stake SOL",
  });

  const {
    balance: solBalance,
    refresh: refreshBalance,
    refreshControl,
  } = useSolBalance();

  const { execute, loading: staking } = useLazorkitTransaction({
    successAlertTitle: "Staked Successfully! 🎉",
    onSuccess: () => {
      setAmount("");
      refreshBalance();
      fetchStakeAccounts();
    },
  });

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string>(
    VALIDATORS[0].voteAccount
  );
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const connection = getConnection();

  const fetchStakeAccounts = useCallback(async () => {
    if (!publicKey) return;

    try {
      const accounts = await getStakeAccounts(connection, publicKey);
      setStakeAccounts(accounts);
    } catch (error) {
      console.error("Error fetching stake accounts:", error);
    }
  }, [publicKey, connection]);

  useFocusEffect(
    useCallback(() => {
      if (isConnected && publicKey) {
        setLoading(true);
        fetchStakeAccounts().finally(() => setLoading(false));
      }
    }, [isConnected, publicKey, fetchStakeAccounts])
  );

  const handleStake = async () => {
    if (!isConnected || !publicKey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    const stakeAmount = parseFloat(amount);

    if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE_AMOUNT) {
      Alert.alert("Error", `Minimum stake amount is ${MIN_STAKE_AMOUNT} SOL`);
      return;
    }

    if (solBalance !== null && stakeAmount > solBalance - 0.01) {
      Alert.alert(
        "Insufficient Balance",
        `You need at least ${stakeAmount + 0.01} SOL`
      );
      return;
    }

    if (!selectedValidator) {
      Alert.alert("Error", "Please select a validator");
      return;
    }

    try {
      const { instructions, stakeAccountPubkey, seed } =
        await createStakeAccountInstructions(
          connection,
          publicKey,
          stakeAmount,
          new PublicKey(selectedValidator)
        );

      console.log(`Stake account: ${stakeAccountPubkey.toBase58()}`);
      console.log(`Seed: ${seed}`);

      await execute({
        instructions,
        redirectPath: "stake",
        computeUnitLimit: 200_000,
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to stake");
    }
  };

  const openExplorer = (address: string) => {
    const url = getAddressExplorerUrl(address, "devnet");
    Linking.openURL(url);
  };

  const getStateDisplay = (state: StakeAccountInfo["state"]) => {
    switch (state) {
      case "active":
        return { emoji: "✅", text: "Active", color: "#14F195" };
      case "activating":
        return { emoji: "⏳", text: "Activating", color: "#FFD700" };
      case "deactivating":
        return { emoji: "📤", text: "Deactivating", color: "#FF6B6B" };
      default:
        return { emoji: "⚪", text: "Inactive", color: "#888" };
    }
  };

  if (!isConnected) {
    return <NotConnectedView />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Stake SOL</Text>
        <Text style={styles.subtitle}>
          Earn rewards by staking to validators
        </Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {solBalance !== null ? solBalance.toFixed(4) : "-.----"} SOL
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Stake Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            placeholder={`Min: ${MIN_STAKE_AMOUNT} SOL`}
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Validator Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Validator</Text>
          {VALIDATORS.map((validator) => (
            <TouchableOpacity
              key={validator.voteAccount}
              style={[
                styles.validatorOption,
                selectedValidator === validator.voteAccount &&
                  styles.validatorSelected,
              ]}
              onPress={() => setSelectedValidator(validator.voteAccount)}
            >
              <View style={styles.radioOuter}>
                {selectedValidator === validator.voteAccount && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.validatorInfo}>
                <Text style={styles.validatorName}>{validator.name}</Text>
                <Text style={styles.validatorAddress}>
                  {truncateAddress(validator.voteAccount)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stake Button */}
        <TouchableOpacity
          style={[styles.stakeButton, staking && styles.buttonDisabled]}
          onPress={handleStake}
          disabled={staking}
        >
          {staking ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.stakeButtonText}>Stake SOL 🥩</Text>
          )}
        </TouchableOpacity>

        {/* Existing Stake Accounts */}
        <View style={styles.stakeAccountsSection}>
          <Text style={styles.sectionTitle}>Your Stake Accounts</Text>

          {loading ? (
            <ActivityIndicator color={AppColors.primary} />
          ) : stakeAccounts.length === 0 ? (
            <Text style={styles.emptyText}>No stake accounts yet</Text>
          ) : (
            stakeAccounts.map((account) => {
              const state = getStateDisplay(account.state);
              const solAmount = account.lamports / LAMPORTS_PER_SOL;

              return (
                <TouchableOpacity
                  key={account.address}
                  style={styles.stakeAccountCard}
                  onPress={() => openExplorer(account.address)}
                >
                  <View style={styles.stakeAccountHeader}>
                    <Text style={styles.stakeAccountAmount}>
                      {solAmount.toFixed(4)} SOL
                    </Text>
                    <View
                      style={[
                        styles.stateBadge,
                        { backgroundColor: state.color + "20" },
                      ]}
                    >
                      <Text style={[styles.stateText, { color: state.color }]}>
                        {state.emoji} {state.text}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.stakeAccountAddress}>
                    {truncateAddress(account.address, 8, 8)}
                  </Text>

                  {account.validator && (
                    <Text style={styles.validatorText}>
                      Validator: {truncateAddress(account.validator)}
                    </Text>
                  )}

                  <Text style={styles.tapHint}>Tap to view on Explorer →</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#9945FF33",
  },
  balanceLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
  },
  balanceValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  validatorOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  validatorSelected: {
    borderColor: "#9945FF",
    backgroundColor: "#1a1a2e",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#9945FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#9945FF",
  },
  validatorInfo: {
    flex: 1,
  },
  validatorName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  validatorAddress: {
    color: "#888",
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },
  stakeButton: {
    backgroundColor: "#9945FF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  stakeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  stakeAccountsSection: {
    marginTop: 40,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    paddingVertical: 20,
  },
  stakeAccountCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  stakeAccountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stakeAccountAmount: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  stateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  stakeAccountAddress: {
    color: "#888",
    fontFamily: "monospace",
    fontSize: 12,
  },
  validatorText: {
    color: "#666",
    fontSize: 11,
    marginTop: 8,
  },
  tapHint: {
    color: "#9945FF",
    fontSize: 11,
    marginTop: 8,
    textAlign: "right",
  },
});
```

_Listing 3-9: Complete staking screen with full implementation_

---

## Advanced Topics

### Deactivating Stake

To unstake, you first deactivate (takes ~2 epochs):

```typescript
import { createDeactivateInstruction } from "@/services/staking";

const handleDeactivate = async (stakeAccountAddress: string) => {
  const instructions = createDeactivateInstruction(
    new PublicKey(stakeAccountAddress),
    publicKey! // Your wallet as authority
  );

  await execute({
    instructions,
    redirectPath: "stake",
  });
};
```

### Withdrawing Stake

After deactivation is complete, withdraw:

```typescript
import { createWithdrawInstruction } from "@/services/staking";

const handleWithdraw = async (
  stakeAccountAddress: string,
  lamports: number
) => {
  const instructions = createWithdrawInstruction(
    new PublicKey(stakeAccountAddress),
    publicKey!, // Withdrawer authority
    publicKey!, // Destination (your wallet)
    lamports
  );

  await execute({
    instructions,
    redirectPath: "stake",
  });
};
```

_Listing 3-11: Withdrawing from a deactivated stake account_

---

## Testing Your Implementation

### Test Checklist

- [ ] Connect wallet with Devnet SOL
- [ ] Enter stake amount (≥0.01 SOL)
- [ ] Select a validator
- [ ] Tap Stake → browser opens
- [ ] Complete biometric auth
- [ ] Redirect back to app
- [ ] See success alert
- [ ] New stake account appears in list
- [ ] Stake shows "Activating" status
- [ ] Tap stake account → opens in Explorer

### Devnet Testing Tips

1. **Get test SOL**: Use [solfaucet.com](https://solfaucet.com)
2. **Stakes activate slowly on devnet**: May take hours
3. **Check Explorer**: Verify stake account was created
4. **Monitor logs**: Use `isDebug={true}` on provider

---

## 🎉 What You've Learned

- ✅ How Solana native staking works
- ✅ The `createAccountWithSeed` pattern for LazorKit
- ✅ Building multi-instruction transactions
- ✅ Displaying stake account states
- ✅ Validator selection UI
- ✅ Deactivation and withdrawal flows

---

## 🎓 Congratulations!

You've completed three LazorKit tutorials! You now have the knowledge to build production-ready passkey-powered Solana applications.

### Summary of What You Built

| Tutorial | Feature           | Key Concept                     |
| -------- | ----------------- | ------------------------------- |
| 1        | Passkey Wallet    | WebAuthn + Smart Wallets        |
| 2        | Gasless Transfers | Paymaster Integration           |
| 3        | SOL Staking       | Multi-instruction Txs with Seed |

### Next Steps

Feeling enthusiastic? Let's learn about Lazorkit with Solana's Memo Program

- [Tutorial 4: On-Chain Memos](./04-ON_CHAIN_MEMOS.md) - Store permanent messages on Solana
