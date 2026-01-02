# 📖 API Reference

Complete reference for all hooks, services, and utilities in PassPay.

---

## Table of Contents

- [Hooks](#hooks)
  - [useLazorkitTransaction](#uselazorkittransaction)
  - [useWalletGuard](#usewalletguard)
  - [useSolBalance](#usesolbalance)
  - [useTransactionHistory](#usetransactionhistory)
  - [useClipboard](#useclipboard)
- [Services](#services)
  - [RPC Service](#rpc-service)
  - [Transfer Service](#transfer-service)
  - [Staking Service](#staking-service)
  - [Memo Service](#memo-service)
- [Utilities](#utilities)
  - [Helpers](#helpers)
  - [Redirect URL](#redirect-url)
- [Types](#types)

---

## Hooks

### useLazorkitTransaction

A hook that abstracts LazorKit transaction signing with loading states, error handling, and gasless configuration.

#### Import

```typescript
import { useLazorkitTransaction } from "@/hooks";
```

#### Interface

```typescript
interface UseLazorkitTransactionOptions {
  gasless?: boolean;
  paymasterUrl?: string;
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
}

interface UseLazorkitTransactionReturn {
  execute: (params: ExecuteParams) => Promise<string | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

interface ExecuteParams {
  instructions: TransactionInstruction[];
  lookupTables?: AddressLookupTableAccount[];
}
```

#### Parameters

| Parameter      | Type                     | Default                    | Description                          |
| -------------- | ------------------------ | -------------------------- | ------------------------------------ |
| `gasless`      | `boolean`                | `true`                     | Enable fee sponsorship via paymaster |
| `paymasterUrl` | `string`                 | `kora.devnet.lazorkit.com` | Paymaster service URL                |
| `onSuccess`    | `(sig: string) => void`  | -                          | Callback when transaction succeeds   |
| `onError`      | `(error: Error) => void` | -                          | Callback when transaction fails      |

#### Returns

| Property     | Type             | Description             |
| ------------ | ---------------- | ----------------------- |
| `execute`    | `function`       | Execute the transaction |
| `loading`    | `boolean`        | Transaction in progress |
| `error`      | `string \| null` | Error message if failed |
| `clearError` | `function`       | Reset error state       |

#### Example

```typescript
const { execute, loading, error } = useLazorkitTransaction({
  gasless: true,
  onSuccess: (signature) => {
    console.log("Transaction confirmed:", signature);
    Alert.alert("Success!", `Signature: ${signature.slice(0, 8)}...`);
  },
  onError: (error) => {
    console.error("Transaction failed:", error);
  },
});

// Execute a transaction
const handleTransfer = async () => {
  const instruction = SystemProgram.transfer({
    fromPubkey: wallet,
    toPubkey: recipient,
    lamports: LAMPORTS_PER_SOL * 0.01,
  });

  const signature = await execute({ instructions: [instruction] });

  if (signature) {
    // Transaction succeeded
  }
};
```

---

### useWalletGuard

A hook that provides wallet connection state and a pre-built "Not Connected" UI component.

#### Import

```typescript
import { useWalletGuard } from "@/hooks";
```

#### Interface

```typescript
interface UseWalletGuardReturn {
  isConnected: boolean;
  publicKey: PublicKey | null;
  truncatedAddress: string | null;
  NotConnectedView: React.FC;
}
```

#### Returns

| Property           | Type                | Description                          |
| ------------------ | ------------------- | ------------------------------------ |
| `isConnected`      | `boolean`           | Whether wallet is connected          |
| `publicKey`        | `PublicKey \| null` | Connected wallet address             |
| `truncatedAddress` | `string \| null`    | Shortened address for display        |
| `NotConnectedView` | `React.FC`          | Component to show when not connected |

#### Example

```typescript
export default function TransferScreen() {
  const { isConnected, publicKey, truncatedAddress, NotConnectedView } =
    useWalletGuard();

  // Show connect prompt if not connected
  if (!isConnected) {
    return <NotConnectedView />;
  }

  // Main screen content
  return (
    <View>
      <Text>Connected: {truncatedAddress}</Text>
      {/* ... */}
    </View>
  );
}
```

---

### useSolBalance

A hook that fetches and manages SOL balance with automatic refresh on screen focus.

#### Import

```typescript
import { useSolBalance } from "@/hooks";
```

#### Interface

```typescript
interface UseSolBalanceOptions {
  publicKey: PublicKey | null;
  refreshOnFocus?: boolean;
}

interface UseSolBalanceReturn {
  balance: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

#### Parameters

| Parameter        | Type                | Default | Description                          |
| ---------------- | ------------------- | ------- | ------------------------------------ |
| `publicKey`      | `PublicKey \| null` | -       | Wallet address to check              |
| `refreshOnFocus` | `boolean`           | `true`  | Auto-refresh when screen gains focus |

#### Returns

| Property  | Type             | Description              |
| --------- | ---------------- | ------------------------ |
| `balance` | `number \| null` | Balance in SOL           |
| `loading` | `boolean`        | Fetching in progress     |
| `error`   | `string \| null` | Error message if failed  |
| `refresh` | `function`       | Manually trigger refresh |

#### Example

```typescript
function WalletScreen() {
  const { smartWalletPubkey } = useWallet();
  const { balance, loading, refresh } = useSolBalance({
    publicKey: smartWalletPubkey,
  });

  return (
    <View>
      {loading ? <ActivityIndicator /> : <Text>{balance?.toFixed(4)} SOL</Text>}
      <Button title="Refresh" onPress={refresh} />
    </View>
  );
}
```

---

### useTransactionHistory

A hook for managing local transaction history with AsyncStorage persistence.

#### Import

```typescript
import { useTransactionHistory } from "@/hooks";
```

#### Interface

```typescript
interface Transaction {
  id: string;
  type: "transfer" | "stake" | "memo";
  signature: string;
  amount?: number;
  recipient?: string;
  timestamp: number;
}

interface UseTransactionHistoryReturn {
  history: Transaction[];
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => Promise<void>;
  clearHistory: () => Promise<void>;
  getExplorerUrl: (signature: string) => string;
}
```

#### Returns

| Property         | Type            | Description                    |
| ---------------- | --------------- | ------------------------------ |
| `history`        | `Transaction[]` | Array of past transactions     |
| `loading`        | `boolean`       | Loading history from storage   |
| `addTransaction` | `function`      | Add new transaction to history |
| `clearHistory`   | `function`      | Clear all history              |
| `getExplorerUrl` | `function`      | Get Solana Explorer URL        |

#### Example

```typescript
function HistoryScreen() {
  const { history, addTransaction, getExplorerUrl } = useTransactionHistory();

  // Add a transaction after success
  await addTransaction({
    type: "transfer",
    signature: "5xY9...",
    amount: 0.01,
    recipient: "7abc...",
  });

  // Display history
  return (
    <FlatList
      data={history}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => Linking.openURL(getExplorerUrl(item.signature))}
        >
          <Text>
            {item.type}: {item.amount} SOL
          </Text>
          <Text>{new Date(item.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

---

### useClipboard

A hook for clipboard operations with haptic feedback.

#### Import

```typescript
import { useClipboard } from "@/hooks";
```

#### Interface

```typescript
interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  paste: () => Promise<string | null>;
  copied: boolean;
}
```

#### Returns

| Property | Type       | Description                |
| -------- | ---------- | -------------------------- |
| `copy`   | `function` | Copy text to clipboard     |
| `paste`  | `function` | Get text from clipboard    |
| `copied` | `boolean`  | True briefly after copying |

#### Example

```typescript
function AddressDisplay({ address }: { address: string }) {
  const { copy, copied } = useClipboard();

  return (
    <TouchableOpacity onPress={() => copy(address)}>
      <Text>{truncateAddress(address)}</Text>
      <Text>{copied ? "Copied!" : "Tap to copy"}</Text>
    </TouchableOpacity>
  );
}
```

---

## Services

### RPC Service

Singleton connection to Solana RPC with caching utilities.

#### Location

```
services/rpc.ts
```

#### Functions

```typescript
// Get or create connection singleton
function getConnection(): Connection;

// Get connection with custom endpoint
function getConnection(endpoint?: string): Connection;

// Devnet RPC endpoint constant
const DEVNET_RPC: string;
```

#### Example

```typescript
import { getConnection, DEVNET_RPC } from "@/services/rpc";

const connection = getConnection();
const balance = await connection.getBalance(publicKey);
```

---

### Transfer Service

Utilities for SOL transfer operations.

#### Location

```
services/transfer.ts
```

#### Functions

```typescript
/**
 * Create a SOL transfer instruction
 */
function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
): TransactionInstruction;

/**
 * Validate a Solana address
 */
function isValidSolanaAddress(address: string): boolean;

/**
 * Convert SOL to lamports
 */
function solToLamports(sol: number): number;

/**
 * Convert lamports to SOL
 */
function lamportsToSol(lamports: number): number;
```

#### Example

```typescript
import {
  createTransferInstruction,
  isValidSolanaAddress,
  solToLamports,
} from "@/services/transfer";

// Validate address
if (!isValidSolanaAddress(recipientAddress)) {
  throw new Error("Invalid address");
}

// Create instruction
const ix = createTransferInstruction(
  wallet,
  new PublicKey(recipientAddress),
  solToLamports(0.01)
);
```

---

### Staking Service

Utilities for native SOL staking.

#### Location

```
services/staking.ts
```

#### Functions

```typescript
/**
 * Create stake account and delegation instructions
 * Uses createAccountWithSeed to avoid extra signers
 */
async function createStakeAccountInstructions(params: {
  walletPubkey: PublicKey;
  lamports: number;
  validatorVoteAccount: PublicKey;
}): Promise<{
  instructions: TransactionInstruction[];
  stakeAccountPubkey: PublicKey;
}>;

/**
 * Get current stake account rent exemption
 */
async function getStakeRentExemption(): Promise<number>;

/**
 * Fetch active validators
 */
async function getValidators(): Promise<ValidatorInfo[]>;
```

#### Example

```typescript
import { createStakeAccountInstructions } from "@/services/staking";

const { instructions, stakeAccountPubkey } =
  await createStakeAccountInstructions({
    walletPubkey: wallet,
    lamports: LAMPORTS_PER_SOL * 1, // 1 SOL
    validatorVoteAccount: validatorPubkey,
  });

// Execute via LazorKit
await execute({ instructions });
```

---

### Memo Service

Utilities for on-chain memo operations.

#### Location

```
services/memo.ts
```

#### Functions

```typescript
/**
 * Create a memo instruction
 */
function createMemoInstruction(
  message: string,
  signer: PublicKey
): TransactionInstruction;

/**
 * Validate memo length
 */
function isValidMemoLength(message: string): boolean;

/**
 * Maximum memo length in bytes
 */
const MAX_MEMO_LENGTH: number; // 566 bytes
```

#### Example

```typescript
import { createMemoInstruction, isValidMemoLength } from "@/services/memo";

if (!isValidMemoLength(message)) {
  throw new Error("Memo too long");
}

const memoIx = createMemoInstruction(message, wallet);
await execute({ instructions: [memoIx] });
```

---

## Utilities

### Helpers

Common helper functions used throughout the app.

#### Location

```
utils/helpers.ts
```

#### Functions

```typescript
/**
 * Truncate address for display
 * "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
 * → "7xKX...sAsU"
 */
function truncateAddress(address: string, chars?: number): string;

/**
 * Format SOL amount for display
 * 1.234567890 → "1.2346"
 */
function formatSol(lamports: number, decimals?: number): string;

/**
 * Get Solana Explorer URL for transaction
 */
function getExplorerUrl(
  signature: string,
  cluster?: "mainnet" | "devnet" | "testnet"
): string;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void>;

/**
 * Check if string is valid base58
 */
function isBase58(str: string): boolean;
```

#### Example

```typescript
import { truncateAddress, formatSol, getExplorerUrl } from "@/utils/helpers";

// Display
<Text>{truncateAddress(address)}</Text>
<Text>{formatSol(lamports)} SOL</Text>

// Link
const url = getExplorerUrl(signature, "devnet");
```

---

### Redirect URL

Build deep link URLs for authentication redirects.

#### Location

```
utils/redirect-url.ts
```

#### Functions

```typescript
/**
 * Get appropriate redirect URL based on environment
 * Expo Go: exp://192.168.1.x:8081
 * Standalone: passpaymobile://
 */
function getRedirectUrl(path?: string): string;

/**
 * Parse incoming redirect URL
 */
function parseRedirectUrl(url: string): {
  path: string;
  params: Record<string, string>;
};
```

#### Example

```typescript
import { getRedirectUrl } from "@/utils/redirect-url";

// In LazorKitProvider config
const redirectUrl = getRedirectUrl();

// Connect with redirect
await connect({
  redirectUri: getRedirectUrl("/auth-callback"),
});
```

---

## Types

### Common Types

```typescript
// Transaction type for history
type TransactionType = "transfer" | "stake" | "memo" | "other";

// Network cluster
type Cluster = "mainnet-beta" | "devnet" | "testnet";

// Validator information
interface ValidatorInfo {
  votePubkey: PublicKey;
  nodePubkey: PublicKey;
  commission: number;
  activatedStake: number;
}

// Balance info
interface BalanceInfo {
  lamports: number;
  sol: number;
}

// Transaction status
type TransactionStatus = "pending" | "confirmed" | "failed";
```

### LazorKit Types (from SDK)

```typescript
// Wallet hook return type
interface UseWalletReturn {
  smartWalletPubkey: PublicKey | null;
  isConnecting: boolean;
  connect: (options: ConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (options: SignOptions) => Promise<string>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

// Connection options
interface ConnectOptions {
  redirectUri?: string;
}

// Signing options
interface SignOptions {
  instructions: TransactionInstruction[];
  lookupTables?: AddressLookupTableAccount[];
  gasConfig?: {
    type: "paymaster";
    paymasterUrl: string;
  };
  redirectUrl?: string;
}
```

---

## Constants

### Theme Constants

```typescript
// constants/theme.ts
export const Colors = {
  primary: "#512DA8",
  secondary: "#7C4DFF",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",

  background: {
    light: "#FFFFFF",
    dark: "#121212",
  },

  text: {
    light: "#000000",
    dark: "#FFFFFF",
  },
};
```

### Network Constants

```typescript
// Defined in services
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MAINNET_RPC = "https://api.mainnet-beta.solana.com";
export const PORTAL_URL = "https://portal.lazor.sh";
export const PAYMASTER_DEVNET = "https://kora.devnet.lazorkit.com";
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Tutorials](./tutorials/)
- [Troubleshooting](./TROUBLESHOOTING.md)
