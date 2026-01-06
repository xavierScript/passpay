# 📝 Tutorial 4: On-Chain Memos

Store permanent messages on the Solana blockchain using LazorKit.

---

## Overview

The Solana Memo Program is one of the simplest programs on Solana. It allows you to store arbitrary text permanently on-chain—perfect for:

- **Proof of Existence** - Timestamp ideas or documents
- **Transaction Annotations** - Add context to payments
- **On-Chain Notes** - Personal or public messages
- **Integration Testing** - Verify your LazorKit setup works

This tutorial is a great "hello world" for LazorKit—if memos work, your integration is set up correctly!

---

## Understanding the Memo Program

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MEMO PROGRAM FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

User types message
         │
         ▼
┌─────────────────────┐
│  createMemoInstr()  │  ← Encode message as instruction data
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  signAndSendTx()    │  ← LazorKit signs with passkey
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Transaction Log    │  ← Message stored in tx logs (not account)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Permanent Record   │  ← Viewable forever on Solana Explorer
└─────────────────────┘
```

### Key Points

| Aspect         | Details                                       |
| -------------- | --------------------------------------------- |
| **Program ID** | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |
| **Storage**    | Transaction logs (not accounts)               |
| **Max Size**   | ~566 bytes per memo                           |
| **Cost**       | Transaction fee only (free with paymaster)    |
| **Permanence** | Immutable once confirmed                      |

---

## Step 1: Create the Memo Service

Create a service to build memo instructions:

```typescript
// services/memo.ts
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

// Memo Program ID (same on mainnet and devnet)
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

/**
 * Create a memo instruction with signer
 * @param message - Text to store on-chain (max ~566 bytes)
 * @param signer - Public key that will sign this memo
 */
export function createMemoInstruction(
  message: string,
  signer: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [
      {
        pubkey: signer,
        isSigner: true,
        isWritable: false,
      },
    ],
    data: Buffer.from(message, "utf-8"),
  });
}

/**
 * Create unsigned memo (included in tx but not attributed to signer)
 */
export function createUnsignedMemoInstruction(
  message: string
): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(message, "utf-8"),
  });
}
```

_Listing 5-1: The memo service with signed and unsigned instruction creation_

This service provides two ways to create memos. Let's understand the difference:

```typescript
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);
```

The Memo Program is a standard Solana program deployed at this address on both mainnet and devnet. You don't deploy it—it's already there, waiting for instructions.

```typescript
return new TransactionInstruction({
  programId: MEMO_PROGRAM_ID,
  keys: [
    {
      pubkey: signer,
      isSigner: true,
      isWritable: false,
    },
  ],
  data: Buffer.from(message, "utf-8"),
});
```

The instruction structure is simple:

- `programId`: Where to send this instruction (the Memo Program)
- `keys`: Accounts involved—here, just the signer for attribution
- `data`: The memo content, UTF-8 encoded

The `isSigner: true` means this address must sign the transaction. The `isWritable: false` indicates we're not modifying account data—memos are stored in transaction logs, not accounts.

### Why Two Functions?

| Function                        | Use Case                                         |
| ------------------------------- | ------------------------------------------------ |
| `createMemoInstruction`         | Message attributed to signer (proves authorship) |
| `createUnsignedMemoInstruction` | Anonymous memo, just data in transaction         |

---

## Step 2: Build the Memo Screen

```typescript
// app/(tabs)/memo.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { createMemoInstruction } from "@/services/memo";
import { getRedirectUrl } from "@/utils/redirect-url";

export default function MemoScreen() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation
  const isConnected = !!smartWalletPubkey;
  const isValidMessage = message.trim().length > 0 && message.length <= 500;

  const handleSendMemo = async () => {
    if (!smartWalletPubkey || !isValidMessage) return;

    setLoading(true);

    try {
      // 1. Create the memo instruction
      const memoInstruction = createMemoInstruction(
        message.trim(),
        smartWalletPubkey
      );

      // 2. Sign and send with LazorKit
      const signature = await signAndSendTransaction(
        {
          instructions: [memoInstruction],
          transactionOptions: {
            feeToken: "USDC", // Gasless!
          },
        },
        {
          redirectUrl: getRedirectUrl("memo"),
          onSuccess: (sig) => {
            console.log("Memo saved:", sig);
            Alert.alert(
              "Memo Saved! ✅",
              "Your message is now permanently on Solana!",
              [
                {
                  text: "View on Explorer",
                  onPress: () => openExplorer(sig),
                },
                { text: "OK" },
              ]
            );
            setMessage(""); // Clear input
          },
          onFail: (error) => {
            console.error("Memo failed:", error);
            Alert.alert("Error", error.message);
          },
        }
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <View style={styles.centered}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.message}>Connect wallet to write memos</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>On-Chain Memo</Text>
      <Text style={styles.subtitle}>Write permanent messages on Solana</Text>

      {/* Message Input */}
      <View style={styles.inputCard}>
        <Text style={styles.label}>Your Message</Text>
        <TextInput
          style={styles.textArea}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message here..."
          multiline
          numberOfLines={5}
          maxLength={500}
          editable={!loading}
        />
        <Text style={styles.charCount}>{message.length}/500</Text>
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.button, !isValidMessage && styles.buttonDisabled]}
        onPress={handleSendMemo}
        disabled={!isValidMessage || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Save to Blockchain 📝</Text>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          Your message is encoded into a Solana transaction and stored
          permanently in the transaction logs. Anyone can verify it existed at
          this exact moment in time.
        </Text>
      </View>
    </ScrollView>
  );
}
```

_Listing 5-2: The complete memo screen with UI and transaction logic_

This screen combines UI and blockchain interaction. Let's examine the key parts:

```typescript
const isValidMessage = message.trim().length > 0 && message.length <= 500;
```

We validate the message before allowing submission. Empty messages are rejected, and we cap at 500 characters (well under the 566-byte limit) to leave room for UTF-8 encoding of special characters.

```typescript
const memoInstruction = createMemoInstruction(
  message.trim(),
  smartWalletPubkey
);
```

We create the memo instruction with the trimmed message and our wallet as the signer. The wallet address will appear in the transaction logs, proving authorship.

```typescript
transactionOptions: {
  feeToken: "USDC", // Gasless!
},
```

Setting `feeToken: "USDC"` enables gasless mode—the paymaster pays the transaction fee. Users don't need SOL in their wallet just to write a memo.

```typescript
Alert.alert("Memo Saved! ✅", "Your message is now permanently on Solana!", [
  {
    text: "View on Explorer",
    onPress: () => openExplorer(sig),
  },
  { text: "OK" },
]);
```

The success alert offers a link to view the transaction on an explorer. This lets users verify their memo was actually recorded on-chain.

---

## Step 3: Using the Custom Hook (Cleaner)

For cleaner code, use the `useLazorkitTransaction` hook:

```typescript
// app/(tabs)/memo.tsx - with custom hook
import { useLazorkitTransaction, useWalletGuard } from "@/hooks";
import { createMemoInstruction } from "@/services/memo";

export default function MemoScreen() {
  const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
    icon: "📝",
    message: "Connect wallet to write memos",
  });

  const [message, setMessage] = useState("");

  const { execute, loading } = useLazorkitTransaction({
    gasless: true,
    onSuccess: (signature) => {
      Alert.alert("Success!", "Memo saved to blockchain");
      setMessage("");
    },
  });

  const handleSendMemo = async () => {
    if (!publicKey || !message.trim()) return;

    const instruction = createMemoInstruction(message.trim(), publicKey);
    await execute({ instructions: [instruction] });
  };

  if (!isConnected) {
    return <NotConnectedView />;
  }

  return (
    <View>
      <TextInput value={message} onChangeText={setMessage} maxLength={500} />
      <TouchableOpacity onPress={handleSendMemo} disabled={loading}>
        <Text>{loading ? "Saving..." : "Save Memo"}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

_Listing 5-3: Simplified memo screen using custom hooks_

Compare this to the previous implementation—it's dramatically simpler. Let's see what the hooks provide:

```typescript
const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
  icon: "📝",
  message: "Connect wallet to write memos",
});
```

The `useWalletGuard` hook handles the "not connected" state. It returns a pre-built `NotConnectedView` component with your customized icon and message. No need to write the same fallback UI on every screen.

```typescript
const { execute, loading } = useLazorkitTransaction({
  gasless: true,
  onSuccess: (signature) => {
    Alert.alert("Success!", "Memo saved to blockchain");
    setMessage("");
  },
});
```

The `useLazorkitTransaction` hook manages all transaction complexity:

- Loading states
- Error handling with alerts
- Success callbacks
- Gasless configuration

Your feature code focuses on what makes it unique—the memo content—while the hooks handle the common patterns.

````

**Benefits of the hook approach:**

- Automatic loading state management
- Consistent error handling
- Gasless config abstracted away
- Cleaner component code

---

## Step 4: Viewing Memos

### On Solana Explorer

After a memo transaction, view it on explorer:

```typescript
const openExplorer = (signature: string) => {
  const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  Linking.openURL(url);
};
````

On the explorer, you'll see:

1. **Program Logs** section
2. Your memo text in the `MemoSq4g...` log entry

### Querying Memos Programmatically

```typescript
import { Connection } from "@solana/web3.js";

async function getMemoFromTransaction(
  connection: Connection,
  signature: string
): Promise<string | null> {
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx?.meta?.logMessages) return null;

  // Find memo in logs
  const memoLog = tx.meta.logMessages.find((log) =>
    log.includes("Program log: Memo")
  );

  if (memoLog) {
    // Extract memo text (format: "Program log: Memo (len X): <message>")
    const match = memoLog.match(/Memo \(len \d+\): (.+)/);
    return match ? match[1] : null;
  }

  return null;
}
```

---

## Step 5: Transaction History

Track memo history locally:

```typescript
import { useTransactionHistory } from "@/hooks";

interface MemoRecord {
  message: string;
}

function MemoScreen() {
  const { history, addTransaction, openInExplorer } =
    useTransactionHistory<MemoRecord>();

  const handleSuccess = (signature: string) => {
    addTransaction(signature, { message: message.trim() });
  };

  return (
    <View>
      {/* ... memo form ... */}

      {/* History */}
      <Text>Recent Memos</Text>
      {history.map((item) => (
        <TouchableOpacity
          key={item.signature}
          onPress={() => openInExplorer(item.signature)}
        >
          <Text>{item.extra?.message}</Text>
          <Text>{new Date(item.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Advanced: Memos with Transfers

Combine memos with other instructions:

```typescript
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMemoInstruction } from "@/services/memo";

async function sendTransferWithMemo(
  from: PublicKey,
  to: PublicKey,
  amount: number,
  memo: string
) {
  // Transfer instruction
  const transferIx = SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: amount * LAMPORTS_PER_SOL,
  });

  // Memo instruction
  const memoIx = createMemoInstruction(memo, from);

  // Send both together
  await signAndSendTransaction({
    instructions: [transferIx, memoIx], // Both in one tx
    transactionOptions: { feeToken: "USDC" },
  });
}

// Usage: Payment with note
await sendTransferWithMemo(
  wallet,
  recipientPubkey,
  0.1,
  "Payment for coffee ☕"
);
```

This is useful for:

- Payment references
- Invoice IDs
- Order confirmations
- Any transfer that needs context

---

## Validation & Limits

```typescript
// services/memo.ts - add validation

export const MAX_MEMO_LENGTH = 500; // Safe limit (actual max ~566)

export function validateMemo(message: string): {
  valid: boolean;
  error?: string;
} {
  if (!message || !message.trim()) {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (message.length > MAX_MEMO_LENGTH) {
    return {
      valid: false,
      error: `Message too long (max ${MAX_MEMO_LENGTH} characters)`,
    };
  }

  // Check for valid UTF-8
  try {
    Buffer.from(message, "utf-8");
  } catch {
    return { valid: false, error: "Invalid characters in message" };
  }

  return { valid: true };
}
```

---

## Complete Example

See the full implementation in [app/(tabs)/memo.tsx](<../../app/(tabs)/memo.tsx>).

```
📁 Key Files
├── app/(tabs)/memo.tsx                      ← Screen component
├── features/memo/
│   ├── services/memo.service.ts             ← Memo instruction builder
│   └── styles/memo.styles.ts                ← Styling
└── hooks/                                   ← Shared hooks
    ├── use-lazorkit-transaction.ts
    └── use-transaction-history.ts
```

---

## What You Learned

| Concept                | Implementation                                 |
| ---------------------- | ---------------------------------------------- |
| Memo Program           | Simplest Solana program for text storage       |
| Creating Instructions  | `createMemoInstruction()` with Buffer encoding |
| Signed vs Unsigned     | Memos can prove authorship or be anonymous     |
| Combining Instructions | Memos can annotate transfers                   |
| Viewing on Explorer    | Check transaction logs for memo content        |

---

## Next Steps

Now that you've mastered memos, you understand the core pattern:

1. **Create instruction(s)**
2. **Call `signAndSendTransaction`** with gasless config
3. **Handle success/failure**

Apply this to any Solana program—SPL tokens, NFTs, DeFi, and more!

---

## Related Documentation

- [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md)
- [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- [Tutorial 3: SOL Staking](./03-SOL_STAKING.md)
- [API Reference](../API_REFERENCE.md)
