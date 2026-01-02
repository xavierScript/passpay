# Tutorial 2: Gasless Transactions

**Time to complete: 20-25 minutes**

Learn how to send SOL transactions without requiring users to pay gas fees. LazorKit's paymaster service sponsors transaction fees, creating a seamless user experience.

---

## 📚 Table of Contents

1. [What are Gasless Transactions?](#what-are-gasless-transactions)
2. [How the Paymaster Works](#how-the-paymaster-works)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create Transfer Service](#step-1-create-transfer-service)
5. [Step 2: Build the Transfer Screen](#step-2-build-the-transfer-screen)
6. [Step 3: Implement signAndSendTransaction](#step-3-implement-signandsendtransaction)
7. [Step 4: Handle Success and Errors](#step-4-handle-success-and-errors)
8. [Step 5: Add Transaction History](#step-5-add-transaction-history)
9. [Complete Code Example](#complete-code-example)
10. [Advanced: Custom Transaction Options](#advanced-custom-transaction-options)
11. [Testing Your Implementation](#testing-your-implementation)

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
       │                        │   (biometric auth)   │                   │
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
- ✅ Understand Solana transaction basics

### Get Devnet SOL

You'll need some SOL to test transfers. Get free Devnet SOL:

1. Copy your wallet address from the app
2. Visit [solfaucet.com](https://solfaucet.com/)
3. Paste your address and request SOL

---

## Step 1: Create Transfer Service

First, create a service to handle transfer logic:

```typescript
// services/transfer.ts
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
 *
 * @param fromPubkey - The sender's public key (your smart wallet)
 * @param toPubkey - The recipient's public key
 * @param amountSol - The amount in SOL to transfer
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
    lamports: amountSol * LAMPORTS_PER_SOL,
  });
}
```

### Understanding Solana Instructions

```typescript
// An instruction is NOT a transaction
// It's one action within a transaction

// Think of it like:
// Transaction = Envelope
// Instructions = Letters inside the envelope

const instruction = SystemProgram.transfer({
  fromPubkey: sender,
  toPubkey: recipient,
  lamports: 1_000_000, // 0.001 SOL
});

// One transaction can have multiple instructions
const instructions = [
  instruction1, // Transfer to Alice
  instruction2, // Transfer to Bob
  instruction3, // Write a memo
];
```

---

## Step 2: Build the Transfer Screen

Create the UI for sending SOL:

```typescript
// app/(tabs)/transfer.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  validateAddress,
  validateAmount,
  createTransferInstruction,
} from "@/services/transfer";
import { getRedirectUrl } from "@/utils/redirect-url";

export default function TransferScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if wallet is connected
  if (!isConnected || !smartWalletPubkey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Connect your wallet first to send SOL
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Send SOL</Text>
      <Text style={styles.subtitle}>Gasless transfers powered by LazorKit</Text>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Transactions are sponsored by the paymaster. You don't need SOL for
          gas fees!
        </Text>
      </View>

      {/* Recipient Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Solana address..."
          placeholderTextColor="#666"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount (SOL)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, loading && styles.buttonDisabled]}
        onPress={handleTransfer}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.sendButtonText}>Send SOL 💸</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
```

---

## Step 3: Implement signAndSendTransaction

Now the core function - sending a gasless transaction:

```typescript
const handleTransfer = async () => {
  // ====================================================
  // STEP 1: Validate Inputs
  // ====================================================

  if (!recipient || !amount) {
    Alert.alert("Error", "Please enter recipient address and amount");
    return;
  }

  // Validate recipient address
  const recipientPubkey = validateAddress(recipient);
  if (!recipientPubkey) {
    Alert.alert("Error", "Invalid recipient address");
    return;
  }

  // Validate amount
  const transferAmount = validateAmount(amount);
  if (transferAmount === null) {
    Alert.alert("Error", "Invalid amount");
    return;
  }

  // ====================================================
  // STEP 2: Create Transfer Instruction
  // ====================================================

  // The instruction describes what we want to do
  const transferInstruction = createTransferInstruction(
    smartWalletPubkey!, // From: Your smart wallet
    recipientPubkey, // To: Recipient
    transferAmount // Amount in SOL
  );

  console.log("Transfer instruction created:", {
    from: smartWalletPubkey!.toBase58(),
    to: recipientPubkey.toBase58(),
    amount: transferAmount,
  });

  // ====================================================
  // STEP 3: Sign and Send with Paymaster (Gasless!)
  // ====================================================

  setLoading(true);

  try {
    const signature = await signAndSendTransaction(
      // First argument: Transaction payload
      {
        instructions: [transferInstruction],
        transactionOptions: {
          // 🔥 THIS IS THE MAGIC!
          // Setting feeToken to "USDC" tells the paymaster to pay fees
          feeToken: "USDC",

          // Network for simulation before sending
          clusterSimulation: "devnet", // or "mainnet"
        },
      },
      // Second argument: Options
      {
        // Where to redirect after signing
        redirectUrl: getRedirectUrl("transfer"),

        // Success callback
        onSuccess: (sig) => {
          console.log("✅ Transaction successful!");
          console.log("Signature:", sig);

          Alert.alert(
            "Success! ✅",
            `Sent ${transferAmount} SOL successfully!`,
            [
              {
                text: "View on Explorer",
                onPress: () => openExplorer(sig),
              },
              { text: "OK" },
            ]
          );

          // Clear form
          setRecipient("");
          setAmount("");
          setLoading(false);
        },

        // Error callback
        onFail: (error) => {
          console.error("❌ Transaction failed:", error);
          Alert.alert("Transaction Failed", error.message);
          setLoading(false);
        },
      }
    );

    return signature;
  } catch (error: any) {
    console.error("Error sending transaction:", error);
    Alert.alert("Error", error.message || "Failed to send transaction");
    setLoading(false);
  }
};
```

### The `signAndSendTransaction` API

```typescript
signAndSendTransaction(
  // Payload: What transaction to send
  payload: {
    instructions: TransactionInstruction[];
    transactionOptions: {
      feeToken?: string;           // "USDC" for gasless
      computeUnitLimit?: number;   // Max compute units (optional)
      clusterSimulation: "devnet" | "mainnet";
      addressLookupTableAccounts?: AddressLookupTableAccount[];
    };
  },
  // Options: How to handle the flow
  options: {
    redirectUrl: string;           // Required: deep link back
    onSuccess?: (sig: string) => void;
    onFail?: (error: Error) => void;
  }
): Promise<string>
```

### Transaction Options Explained

| Option                       | Type                    | Description                              |
| ---------------------------- | ----------------------- | ---------------------------------------- |
| `feeToken`                   | `string`                | Set to `"USDC"` for gasless transactions |
| `computeUnitLimit`           | `number`                | Max compute units (default: ~200k)       |
| `clusterSimulation`          | `"devnet" \| "mainnet"` | Network for simulation                   |
| `addressLookupTableAccounts` | `Array`                 | For versioned transactions               |

---

## Step 4: Handle Success and Errors

### Open Transaction in Explorer

```typescript
import * as Linking from "expo-linking";

function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function openExplorer(signature: string) {
  const url = getExplorerUrl(signature);
  Linking.openURL(url);
}
```

### Error Handling Best Practices

```typescript
try {
  await signAndSendTransaction(payload, options);
} catch (error: any) {
  // Common error types
  if (error.message.includes("insufficient")) {
    Alert.alert("Insufficient Balance", "You don't have enough SOL");
  } else if (error.message.includes("rejected")) {
    Alert.alert("Cancelled", "Transaction was cancelled");
  } else if (error.message.includes("timeout")) {
    Alert.alert("Timeout", "Transaction timed out. Please try again.");
  } else {
    Alert.alert("Error", error.message || "Unknown error occurred");
  }
}
```

---

## Step 5: Add Transaction History

Track sent transactions in your app:

```typescript
// hooks/use-transaction-history.ts
import { useState, useCallback } from "react";

interface HistoryItem {
  id: string;
  signature: string;
  timestamp: Date;
  data: {
    recipient: string;
    amount: string;
  };
}

export function useTransactionHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addTransaction = useCallback(
    (signature: string, data: { recipient: string; amount: string }) => {
      const newItem: HistoryItem = {
        id: `${signature}-${Date.now()}`,
        signature,
        timestamp: new Date(),
        data,
      };
      setHistory((prev) => [newItem, ...prev].slice(0, 10)); // Keep last 10
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addTransaction, clearHistory };
}
```

### Display History

```typescript
// In your transfer screen
const { history, addTransaction } = useTransactionHistory();

// After successful transaction
onSuccess: (sig) => {
  addTransaction(sig, { recipient, amount });
  // ...
};

// Render history
{
  history.length > 0 && (
    <View style={styles.historySection}>
      <Text style={styles.historyTitle}>Recent Transfers</Text>
      {history.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.historyItem}
          onPress={() => openExplorer(item.signature)}
        >
          <Text style={styles.historyAmount}>{item.data.amount} SOL</Text>
          <Text style={styles.historyRecipient}>
            → {truncateAddress(item.data.recipient)}
          </Text>
          <Text style={styles.historyTime}>
            {item.timestamp.toLocaleTimeString()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Complete Code Example

Here's the full transfer screen from PassPay:

```typescript
// app/(tabs)/transfer.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
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

import {
  createTransferInstruction,
  validateAddress,
  validateAmount,
} from "@/services/transfer";
import { getRedirectUrl } from "@/utils/redirect-url";
import { truncateAddress, getExplorerUrl } from "@/utils/helpers";

interface TransferRecord {
  recipient: string;
  amount: string;
}

export default function TransferScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      signature: string;
      data: TransferRecord;
      timestamp: Date;
    }>
  >([]);

  // Not connected state
  if (!isConnected || !smartWalletPubkey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.icon}>💸</Text>
        <Text style={styles.message}>Connect wallet to send SOL</Text>
      </View>
    );
  }

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      Alert.alert("Error", "Please enter recipient address and amount");
      return;
    }

    const recipientPubkey = validateAddress(recipient);
    if (!recipientPubkey) {
      Alert.alert("Error", "Invalid recipient address");
      return;
    }

    const transferAmount = validateAmount(amount);
    if (transferAmount === null) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    const instruction = createTransferInstruction(
      smartWalletPubkey,
      recipientPubkey,
      transferAmount
    );

    setLoading(true);

    try {
      await signAndSendTransaction(
        {
          instructions: [instruction],
          transactionOptions: {
            feeToken: "USDC", // Gasless!
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: getRedirectUrl("transfer"),
          onSuccess: (signature) => {
            // Add to history
            setHistory((prev) =>
              [
                {
                  signature,
                  data: { recipient, amount },
                  timestamp: new Date(),
                },
                ...prev,
              ].slice(0, 10)
            );

            // Clear form
            setRecipient("");
            setAmount("");
            setLoading(false);

            Alert.alert(
              "Transfer Sent! ✅",
              `Successfully sent ${transferAmount} SOL`,
              [
                {
                  text: "View on Explorer",
                  onPress: () => Linking.openURL(getExplorerUrl(signature)),
                },
                { text: "OK" },
              ]
            );
          },
          onFail: (error) => {
            console.error("Transfer failed:", error);
            Alert.alert("Transfer Failed", error.message);
            setLoading(false);
          },
        }
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send transfer");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <Text style={styles.title}>Send SOL</Text>
        <Text style={styles.subtitle}>
          Gasless transfers powered by LazorKit
        </Text>

        {/* Gasless Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Gasless Transactions</Text>
            <Text style={styles.infoText}>
              Transactions are sponsored by the paymaster. You don't need SOL
              for gas fees!
            </Text>
          </View>
        </View>

        {/* Your Wallet */}
        <View style={styles.walletCard}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.address}>
            {truncateAddress(smartWalletPubkey.toBase58(), 8, 8)}
          </Text>
        </View>

        {/* Recipient Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Solana address..."
            placeholderTextColor="#666"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send SOL 💸</Text>
          )}
        </TouchableOpacity>

        {/* Transaction History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Transfers</Text>
            {history.map((item, index) => (
              <TouchableOpacity
                key={`${item.signature}-${index}`}
                style={styles.historyItem}
                onPress={() => Linking.openURL(getExplorerUrl(item.signature))}
              >
                <View>
                  <Text style={styles.historyAmount}>
                    {item.data.amount} SOL
                  </Text>
                  <Text style={styles.historyRecipient}>
                    → {truncateAddress(item.data.recipient)}
                  </Text>
                </View>
                <Text style={styles.historyTime}>
                  {item.timestamp.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    color: "#888",
    fontSize: 16,
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
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#9945FF33",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: "#9945FF",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    color: "#888",
    fontSize: 13,
    lineHeight: 18,
  },
  walletCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  address: {
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
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
  button: {
    backgroundColor: "#9945FF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  historySection: {
    marginTop: 32,
  },
  historyTitle: {
    color: "#888",
    fontSize: 14,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  historyAmount: {
    color: "#14F195",
    fontSize: 16,
    fontWeight: "600",
  },
  historyRecipient: {
    color: "#888",
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },
  historyTime: {
    color: "#666",
    fontSize: 12,
  },
});
```

---

## Advanced: Custom Transaction Options

### Increasing Compute Units

For complex transactions, you may need more compute units:

```typescript
transactionOptions: {
  feeToken: "USDC",
  computeUnitLimit: 500_000, // Increase from default ~200k
  clusterSimulation: "devnet",
}
```

### Multiple Instructions

Send multiple operations in one transaction:

```typescript
const instructions = [
  // Transfer to Alice
  createTransferInstruction(wallet, alicePubkey, 0.5),
  // Transfer to Bob
  createTransferInstruction(wallet, bobPubkey, 0.3),
  // Add a memo
  createMemoInstruction("Payment for services"),
];

await signAndSendTransaction(
  {
    instructions, // All execute atomically
    transactionOptions: { feeToken: "USDC", clusterSimulation: "devnet" },
  },
  { redirectUrl: getRedirectUrl() }
);
```

### Non-Gasless Transactions

If you want users to pay their own fees:

```typescript
transactionOptions: {
  // Don't set feeToken, or set to SOL
  clusterSimulation: "devnet",
}
```

---

## Testing Your Implementation

### Test Checklist

- [ ] Enter a valid recipient address
- [ ] Enter a valid amount
- [ ] Tap Send → browser opens for biometric auth
- [ ] Complete biometric authentication
- [ ] Redirect back to app
- [ ] Success alert appears
- [ ] Transaction appears in history
- [ ] "View on Explorer" opens the transaction
- [ ] Transaction shows on Solana Explorer

### Common Test Scenarios

1. **Happy Path**: Valid address, valid amount, successful send
2. **Invalid Address**: Test with "invalid" as address → should show error
3. **Zero Amount**: Test with "0" → should show error
4. **Insufficient Balance**: Send more than you have → should fail
5. **User Cancels**: Cancel biometric auth → should handle gracefully

### Debug Tips

1. **Enable Debug Mode**:

   ```typescript
   <LazorKitProvider isDebug={true} ... />
   ```

2. **Check Console Logs**:

   ```bash
   npx expo start
   # Watch the Metro bundler console
   ```

3. **Verify Transaction on Explorer**:
   - Open Solana Explorer
   - Switch to Devnet
   - Search for your signature

---

## 🎉 What You've Learned

- ✅ How gasless transactions work with the paymaster
- ✅ Creating Solana transfer instructions
- ✅ Using `signAndSendTransaction` with LazorKit
- ✅ Handling success and error states
- ✅ Building a transaction history feature
- ✅ Advanced options for custom transactions

---

## Next Steps

Continue to [Tutorial 3: Reusable Hooks](./03-REUSABLE_HOOKS.md) to learn how to abstract these patterns into production-ready custom hooks!
