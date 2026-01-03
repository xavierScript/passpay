# 📖 API Reference

Complete reference for all hooks, services, and utilities in PassPay Web.

> **Note**: PassPay Web uses a feature-based folder structure. Services and hooks are organized by feature (wallet, transfer, staking, memo, subscription) in the `features/` directory. For convenience, all hooks and services are re-exported from their traditional locations (`@/hooks` and `@/lib/services`), so both import paths work:
>
> ```typescript
> // Feature-based import (recommended)
> import { useSolBalance } from "@/features/wallet/hooks";
> import { createTransferInstruction } from "@/features/transfer/services";
>
> // Backward-compatible import (also works)
> import { useSolBalance } from "@/hooks";
> import { createTransferInstruction } from "@/lib/services";
> ```

---

## Table of Contents

- [Hooks](#hooks)
  - [useTransaction](#usetransaction)
  - [useTransfer](#usetransfer)
  - [useSolBalance](#usesolbalance)
  - [useStaking](#usestaking)
  - [useMemoHook](#usememohook)
  - [useSubscription](#usesubscription)
- [Services](#services)
  - [RPC Service](#rpc-service)
  - [Transfer Service](#transfer-service)
  - [Staking Service](#staking-service)
  - [Memo Service](#memo-service)
  - [Subscription Service](#subscription-service)
- [Utilities](#utilities)
  - [Utils](#utils)
  - [Constants](#constants)
- [Types](#types)

---

## Hooks

### useTransaction

A hook that abstracts LazorKit transaction signing with loading states, error handling, and toast notifications.

**Location**: `features/wallet/hooks/useTransaction.ts`

#### Import

```typescript
// Feature-based import
import { useTransaction } from "@/features/wallet/hooks";

// Or via re-export
import { useTransaction } from "@/hooks";
```

#### Interface

```typescript
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
```

#### Parameters

| Parameter        | Type     | Default                          | Description                      |
| ---------------- | -------- | -------------------------------- | -------------------------------- |
| `loadingMessage` | `string` | `"Approve with your passkey..."` | Toast message during transaction |
| `successMessage` | `string` | `"Transaction successful! 🎉"`   | Toast message on success         |

#### Returns

| Property    | Type             | Description               |
| ----------- | ---------------- | ------------------------- |
| `execute`   | `function`       | Execute the transaction   |
| `loading`   | `boolean`        | Transaction in progress   |
| `signature` | `string \| null` | Last successful signature |
| `error`     | `string \| null` | Last error message        |

#### Example

```typescript
const { execute, loading } = useTransaction({
  successMessage: "Transfer complete! 🎉",
});

const handleTransfer = async () => {
  const instruction = SystemProgram.transfer({
    fromPubkey: wallet,
    toPubkey: recipient,
    lamports: LAMPORTS_PER_SOL * 0.01,
  });

  const signature = await execute([instruction]);
  if (signature) {
    console.log("Transaction confirmed:", signature);
  }
};
```

---

### useTransfer

A hook for gasless SOL transfers with validation and balance checking.

**Location**: `features/transfer/hooks/useTransfer.ts`

#### Import

```typescript
// Feature-based import
import { useTransfer } from "@/features/transfer/hooks";

// Or via re-export
import { useTransfer } from "@/hooks";
```

#### Interface

```typescript
interface UseTransferReturn {
  transfer: (recipient: string, amount: string) => Promise<string | null>;
  loading: boolean;
  balance: number | null;
  balanceLoading: boolean;
  refreshBalance: () => Promise<void>;
  error: string | null;
}
```

#### Returns

| Property         | Type             | Description               |
| ---------------- | ---------------- | ------------------------- |
| `transfer`       | `function`       | Execute SOL transfer      |
| `loading`        | `boolean`        | Transfer in progress      |
| `balance`        | `number \| null` | Current SOL balance       |
| `balanceLoading` | `boolean`        | Balance fetch in progress |
| `refreshBalance` | `function`       | Manually refresh balance  |
| `error`          | `string \| null` | Last error message        |

#### Example

```typescript
const { transfer, loading, balance } = useTransfer();

const handleSend = async () => {
  const sig = await transfer("recipient-address", "0.1");
  if (sig) {
    console.log("Transfer complete:", sig);
  }
};

return (
  <div>
    <p>Balance: {balance?.toFixed(4)} SOL</p>
    <button onClick={handleSend} disabled={loading}>
      {loading ? "Sending..." : "Send 0.1 SOL"}
    </button>
  </div>
);
```

---

### useSolBalance

A hook that fetches and manages SOL balance with automatic refresh.

**Location**: `features/wallet/hooks/useSolBalance.ts`

#### Import

```typescript
// Feature-based import
import { useSolBalance } from "@/features/wallet/hooks";

// Or via re-export
import { useSolBalance } from "@/hooks";
```

#### Interface

```typescript
interface UseSolBalanceOptions {
  autoFetch?: boolean;
}

interface UseSolBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

#### Parameters

| Parameter   | Type      | Default | Description                     |
| ----------- | --------- | ------- | ------------------------------- |
| `autoFetch` | `boolean` | `true`  | Auto-fetch when wallet connects |

#### Returns

| Property  | Type             | Description              |
| --------- | ---------------- | ------------------------ |
| `balance` | `number \| null` | Balance in SOL           |
| `loading` | `boolean`        | Fetch in progress        |
| `error`   | `string \| null` | Error message if failed  |
| `refresh` | `function`       | Manually refresh balance |

#### Example

```typescript
const { balance, loading, refresh } = useSolBalance();

return (
  <div>
    {loading ? <span>Loading...</span> : <span>{balance?.toFixed(4)} SOL</span>}
    <button onClick={refresh}>Refresh</button>
  </div>
);
```

---

### useStaking

A hook for SOL staking operations including stake account creation and delegation.

**Location**: `features/staking/hooks/useStaking.ts`

#### Import

```typescript
// Feature-based import
import { useStaking } from "@/features/staking/hooks";

// Or via re-export
import { useStaking } from "@/hooks";
```

#### Interface

```typescript
interface StakeAccountInfo {
  address: string;
  lamports: number;
  state: "inactive" | "activating" | "active" | "deactivating";
  validator?: string;
}

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
```

#### Returns

| Property        | Type                 | Description                     |
| --------------- | -------------------- | ------------------------------- |
| `stake`         | `function`           | Stake SOL to a validator        |
| `staking`       | `boolean`            | Staking transaction in progress |
| `balance`       | `number \| null`     | Current SOL balance             |
| `stakeAccounts` | `StakeAccountInfo[]` | User's stake accounts           |
| `loading`       | `boolean`            | Data loading in progress        |
| `refresh`       | `function`           | Refresh balance and accounts    |
| `error`         | `string \| null`     | Last error message              |

#### Example

```typescript
const { stake, staking, balance, stakeAccounts, refresh } = useStaking();

const handleStake = async () => {
  const sig = await stake("1.0", validatorVoteAccount);
  if (sig) {
    console.log("Staked successfully:", sig);
    refresh();
  }
};

return (
  <div>
    <p>Available: {balance?.toFixed(4)} SOL</p>
    <p>Stake Accounts: {stakeAccounts.length}</p>
    <button onClick={handleStake} disabled={staking}>
      {staking ? "Staking..." : "Stake 1 SOL"}
    </button>
  </div>
);
```

---

### useMemoHook

A hook for writing on-chain memos with validation.

**Location**: `features/memo/hooks/useMemo.ts`

#### Import

```typescript
// Feature-based import
import { useMemoHook } from "@/features/memo/hooks";

// Or via re-export
import { useMemoHook } from "@/hooks";
```

#### Interface

```typescript
interface UseMemoReturn {
  writeMemo: (message: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}
```

#### Returns

| Property    | Type             | Description             |
| ----------- | ---------------- | ----------------------- |
| `writeMemo` | `function`       | Write memo on-chain     |
| `loading`   | `boolean`        | Transaction in progress |
| `error`     | `string \| null` | Last error message      |

#### Example

```typescript
const { writeMemo, loading } = useMemoHook();

const handleSubmit = async () => {
  const sig = await writeMemo("Hello, Solana!");
  if (sig) {
    console.log("Memo stored:", sig);
  }
};

return (
  <button onClick={handleSubmit} disabled={loading}>
    {loading ? "Storing..." : "Save Memo"}
  </button>
);
```

---

### useSubscription

A hook for subscription payments using SOL.

**Location**: `features/subscription/hooks/useSubscription.ts`

#### Import

```typescript
// Feature-based import
import { useSubscription } from "@/features/subscription/hooks";

// Or via re-export
import { useSubscription } from "@/hooks";
```

#### Interface

```typescript
interface UseSubscriptionReturn {
  subscribe: (amount: number, planName: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}
```

#### Returns

| Property    | Type             | Description             |
| ----------- | ---------------- | ----------------------- |
| `subscribe` | `function`       | Subscribe to a plan     |
| `loading`   | `boolean`        | Transaction in progress |
| `error`     | `string \| null` | Last error message      |

#### Example

```typescript
const { subscribe, loading } = useSubscription();

const handleSubscribe = async () => {
  const sig = await subscribe(0.01, "Basic");
  if (sig) {
    console.log("Subscribed:", sig);
    router.push("/premium");
  }
};

return (
  <button onClick={handleSubscribe} disabled={loading}>
    {loading ? "Processing..." : "Subscribe for 0.01 SOL"}
  </button>
);
```

---

## Services

### RPC Service

Connection management and balance fetching.

#### Import

```typescript
import {
  getConnection,
  getSolBalance,
  getSolBalanceByAddress,
} from "@/lib/services";
```

#### Functions

##### `getConnection()`

Returns a singleton Connection instance.

```typescript
const connection = getConnection();
```

##### `getSolBalance(pubkey: PublicKey)`

Fetch SOL balance for a PublicKey.

```typescript
const balance = await getSolBalance(smartWalletPubkey);
console.log(`Balance: ${balance} SOL`);
```

##### `getSolBalanceByAddress(address: string)`

Fetch SOL balance for an address string.

```typescript
const balance = await getSolBalanceByAddress("5Qz...");
```

---

### Transfer Service

SOL transfer utilities.

**Location**: `features/transfer/services/transfer.service.ts`

#### Import

```typescript
// Feature-based import
import {
  validateAddress,
  validateAmount,
  createTransferInstruction,
  truncateAddress,
} from "@/features/transfer/services";

// Or via re-export
import {
  validateAddress,
  validateAmount,
  createTransferInstruction,
  truncateAddress,
} from "@/lib/services";
```

#### Functions

##### `validateAddress(address: string)`

Validate and parse a Solana address.

```typescript
const pubkey = validateAddress("5Qz...");
if (!pubkey) {
  console.error("Invalid address");
}
```

##### `validateAmount(amount: string, minAmount?: number)`

Validate and parse an amount string.

```typescript
const value = validateAmount("0.1", 0);
if (!value) {
  console.error("Invalid amount");
}
```

##### `createTransferInstruction(from, to, amountSol)`

Create a SOL transfer instruction.

```typescript
const instruction = createTransferInstruction(
  smartWalletPubkey,
  recipientPubkey,
  0.1
);
```

##### `truncateAddress(address, chars?)`

Truncate address for display.

```typescript
truncateAddress("5Qz...", 4); // "5Qz...XYZ"
```

---

### Staking Service

Native SOL staking utilities.

**Location**: `features/staking/services/staking.service.ts`

#### Import

```typescript
// Feature-based import
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  DEVNET_VALIDATORS,
  MIN_STAKE_AMOUNT,
} from "@/features/staking/services";

// Or via re-export
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  DEVNET_VALIDATORS,
  MIN_STAKE_AMOUNT,
} from "@/lib/services";
```

#### Constants

```typescript
MIN_STAKE_AMOUNT; // 0.01 SOL

DEVNET_VALIDATORS; // Array of known devnet validators
```

#### Functions

##### `createStakeAccountInstructions(...)`

Create instructions for staking SOL.

```typescript
const { instructions, stakeAccountPubkey, seed } =
  await createStakeAccountInstructions(
    connection,
    smartWalletPubkey,
    1.0,
    validatorVoteAccount
  );
```

##### `getStakeAccounts(connection, owner)`

Fetch user's stake accounts.

```typescript
const accounts = await getStakeAccounts(connection, smartWalletPubkey);
```

---

### Memo Service

On-chain memo utilities.

**Location**: `features/memo/services/memo.service.ts`

#### Import

```typescript
// Feature-based import
import {
  createMemoInstruction,
  createUnsignedMemoInstruction,
  validateMemo,
  MEMO_PROGRAM_ID,
} from "@/features/memo/services";

// Or via re-export
import {
  createMemoInstruction,
  createUnsignedMemoInstruction,
  validateMemo,
  MEMO_PROGRAM_ID,
} from "@/lib/services";
```

#### Functions

##### `createMemoInstruction(message, signer)`

Create a signed memo instruction.

```typescript
const instruction = createMemoInstruction("Hello!", smartWalletPubkey);
```

##### `validateMemo(message)`

Validate memo message.

```typescript
const error = validateMemo(message);
if (error) {
  toast.error(error);
}
```

---

### Subscription Service

Subscription storage utilities.

**Location**: `features/subscription/services/subscription.service.ts`

#### Import

```typescript
// Feature-based import
import {
  saveSubscription,
  getSubscription,
  clearSubscription,
} from "@/features/subscription/services";

// Or via re-export
import {
  saveSubscription,
  getSubscription,
  clearSubscription,
} from "@/lib/services";
```

#### Functions

##### `saveSubscription(walletAddress, planName, amount, signature)`

Save subscription to localStorage.

```typescript
saveSubscription(wallet, "Pro", 0.05, signature);
```

##### `getSubscription(walletAddress)`

Get subscription for a wallet.

```typescript
const sub = getSubscription(wallet);
if (sub?.isActive) {
  // Grant access
}
```

---

## Utilities

### Utils

Helper functions in `lib/utils.ts`.

#### `encryptLocal(data: string)`

Simple encryption for local storage.

```typescript
const encrypted = await encryptLocal(credentialId);
localStorage.setItem("credential", encrypted);
```

#### `decryptLocal(encrypted: string)`

Decrypt locally stored data.

```typescript
const credentialId = await decryptLocal(stored);
```

---

### Constants

Configuration in `lib/constants.ts`.

```typescript
// LazorKit configuration
export const DEFAULT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

// Devnet USDC mint
export const USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// Subscription plans
export const PLANS = [
  { id: "basic", name: "Basic", amount: 0.01 },
  { id: "pro", name: "Pro", amount: 0.05 },
  { id: "premium", name: "Premium", amount: 0.1 },
];

// Payment recipient
export const RECIPIENT_WALLET = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";
```

---

## Types

### Common Types

```typescript
// Stake account information
interface StakeAccountInfo {
  address: string;
  lamports: number;
  state: "inactive" | "activating" | "active" | "deactivating";
  validator?: string;
}

// Subscription data
interface SubscriptionData {
  walletAddress: string;
  planName: string;
  amount: number;
  signature: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Validator info
interface ValidatorInfo {
  name: string;
  identity: string;
  voteAccount: string;
}
```
