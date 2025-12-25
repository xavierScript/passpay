# Tutorial 2: Implementing Gasless Mobile Transactions with Lazorkit

This tutorial demonstrates how to implement gasless USDC transfers on mobile using Lazorkit's paymaster service.

## Overview

Traditional Solana transactions require SOL for network fees, creating friction for new users. Lazorkit's paymaster service sponsors transaction fees, allowing users to send USDC without holding SOL.

## Prerequisites

- Completed Tutorial 1 (Passkey Integration)
- `@solana/web3.js` installed
- Lazorkit SDK configured with paymaster

## Architecture

```
User Action → Biometric Auth → Create Transaction → Lazorkit Paymaster → Solana Network
                                                    ↓
                                            Sponsor Fee (USDC)
```

## Step 1: Setup Paymaster Configuration

Configure the paymaster in your `LazorKitProvider`:

```typescript
<LazorKitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  configPaymaster={{
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    apiKey: process.env.EXPO_PUBLIC_LAZORKIT_API_KEY, // Optional
  }}
>
  <App />
</LazorKitProvider>
```

## Step 2: Create Send USDC Screen

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { SystemProgram, PublicKey } from "@solana/web3.js";

function SendUSDCScreen() {
  const { wallet, signAndSendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSend = async () => {
    // 1. Validate inputs
    if (!validateAddress(recipient)) {
      Alert.alert("Error", "Invalid Solana address");
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert("Error", "Amount must be greater than 0");
      return;
    }

    // 2. Prompt biometric confirmation
    const authResult = await authenticateWithBiometric(
      `Confirm sending ${amount} USDC`
    );

    if (!authResult.success) {
      return; // User cancelled or auth failed
    }

    // 3. Create and send transaction
    await sendGaslessUSDC();
  };

  const sendGaslessUSDC = async () => {
    try {
      // Create transfer instruction
      const fromPubkey = new PublicKey(wallet.smartWallet);
      const toPubkey = new PublicKey(recipient);

      const instruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: parseFloat(amount) * 1e9, // Convert to lamports
      });

      // Sign and send with gasless option
      const signature = await signAndSendTransaction(
        {
          instructions: [instruction],
          transactionOptions: {
            feeToken: "USDC", // Pay fees in USDC
            computeUnitLimit: 200_000,
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: "passpay://callback",
          onSuccess: (sig) => {
            console.log("Transaction sent:", sig);
            router.push("/transaction-success");
          },
          onFail: (error) => {
            Alert.alert("Transaction Failed", error.message);
          },
        }
      );

      return signature;
    } catch (error) {
      console.error("Send error:", error);
      throw error;
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Recipient Address"
        value={recipient}
        onChangeText={setRecipient}
      />
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button title="Send USDC" onPress={handleSend} />
    </View>
  );
}
```

## Step 3: QR Code Scanning for Recipients

Install dependencies:

```bash
npm install expo-camera
```

Create QR scanner:

```typescript
import { CameraView, useCameraPermissions } from "expo-camera";

function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // Validate scanned address
    if (isValidSolanaAddress(data)) {
      // Pass address back to send screen
      router.back();
      // Update recipient field
    } else {
      Alert.alert("Invalid QR Code", "Not a valid Solana address");
    }
  };

  if (!permission?.granted) {
    return (
      <View>
        <Text>Camera permission required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      onBarcodeScanned={handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ["qr"],
      }}
    >
      <View style={styles.overlay}>
        <Text>Scan QR Code</Text>
      </View>
    </CameraView>
  );
}
```

## Step 4: Transaction Status Handling

### Wait for Confirmation

```typescript
import { Connection } from "@solana/web3.js";

async function waitForConfirmation(
  signature: string,
  timeout: number = 60000
): Promise<boolean> {
  const connection = new Connection("https://api.devnet.solana.com");
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const status = await connection.getSignatureStatus(signature);

      if (
        status.value?.confirmationStatus === "confirmed" ||
        status.value?.confirmationStatus === "finalized"
      ) {
        return true;
      }

      if (status.value?.err) {
        throw new Error("Transaction failed");
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error checking status:", error);
    }
  }

  throw new Error("Transaction confirmation timeout");
}
```

### Show Success Screen

```typescript
function TransactionSuccessScreen() {
  const params = useLocalSearchParams();
  const { signature, amount } = params;

  return (
    <View>
      <Text>✅ Transaction Sent!</Text>
      <Text>{amount} USDC sent successfully</Text>

      <Button
        title="View on Solscan"
        onPress={() => {
          const url = `https://solscan.io/tx/${signature}?cluster=devnet`;
          Linking.openURL(url);
        }}
      />
    </View>
  );
}
```

## Step 5: Error Handling

```typescript
async function handleSendWithErrorHandling() {
  try {
    await sendGaslessUSDC();
  } catch (error: any) {
    // Network timeout
    if (error.message.includes("timeout")) {
      Alert.alert(
        "Network Error",
        "Transaction took too long. Check your connection.",
        [
          { text: "Cancel" },
          { text: "Retry", onPress: handleSendWithErrorHandling },
        ]
      );
      return;
    }

    // Insufficient balance
    if (error.message.includes("insufficient")) {
      Alert.alert(
        "Insufficient Balance",
        `You don't have enough USDC. Balance: ${balance} USDC`
      );
      return;
    }

    // Invalid address
    if (error.message.includes("invalid")) {
      Alert.alert("Invalid Address", "Please check the recipient address");
      return;
    }

    // Generic error
    Alert.alert("Transaction Failed", "Please try again");
  }
}
```

## Step 6: Loading States

```typescript
function SendUSDCScreen() {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);

    try {
      await sendGaslessUSDC();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View>
      {/* Form inputs */}

      <Button
        title={isSending ? "Sending..." : "Send USDC"}
        onPress={handleSend}
        disabled={isSending}
      />

      {isSending && (
        <Modal visible>
          <ActivityIndicator />
          <Text>Sending transaction...</Text>
        </Modal>
      )}
    </View>
  );
}
```

## Step 7: Transaction Validation

```typescript
function validateTransaction(
  recipient: string,
  amount: string,
  balance: number
) {
  const errors: string[] = [];

  // Validate address
  if (!SOLANA_ADDRESS_REGEX.test(recipient)) {
    errors.push("Invalid recipient address");
  }

  // Validate amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (numAmount > balance) {
    errors.push(`Insufficient balance. You have ${balance} USDC`);
  }

  // Validate minimum amount
  if (numAmount < 0.000001) {
    errors.push("Amount too small");
  }

  return errors;
}

// Usage
const errors = validateTransaction(recipient, amount, balance);
if (errors.length > 0) {
  Alert.alert("Validation Error", errors.join("\n"));
  return;
}
```

## Advanced Features

### 1. Transaction Memo

Add a memo to your transaction:

```typescript
const instruction = SystemProgram.transfer({
  fromPubkey,
  toPubkey,
  lamports: amount,
});

const memoInstruction = new TransactionInstruction({
  keys: [],
  programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
  data: Buffer.from("Payment for services"),
});

await signAndSendTransaction({
  instructions: [instruction, memoInstruction],
  transactionOptions: { feeToken: "USDC" },
});
```

### 2. Batch Transactions

Send to multiple recipients:

```typescript
const instructions = recipients.map(({ address, amount }) =>
  SystemProgram.transfer({
    fromPubkey: new PublicKey(wallet.smartWallet),
    toPubkey: new PublicKey(address),
    lamports: amount * 1e9,
  })
);

await signAndSendTransaction({
  instructions,
  transactionOptions: {
    feeToken: "USDC",
    computeUnitLimit: 400_000, // Higher for multiple instructions
  },
});
```

### 3. Priority Fees

For faster confirmation:

```typescript
transactionOptions: {
  feeToken: 'USDC',
  computeUnitLimit: 200_000,
  computeUnitPrice: 1000, // Micro-lamports
}
```

## Testing Checklist

- [ ] Send small amount (0.01 USDC)
- [ ] Send with valid address
- [ ] Send with invalid address (should fail)
- [ ] Send more than balance (should fail)
- [ ] Cancel biometric prompt (should abort)
- [ ] Test with no internet (should show error)
- [ ] Test QR scanner
- [ ] Test transaction confirmation
- [ ] Test Solscan link

## Best Practices

### 1. Always Validate Before Sending

```typescript
if (!recipient || !amount) return;
if (!isValidSolanaAddress(recipient)) return;
if (parseFloat(amount) > balance) return;
```

### 2. Show Clear Transaction Preview

```typescript
<View>
  <Text>Sending: {amount} USDC</Text>
  <Text>To: {recipient}</Text>
  <Text>Fee: FREE (Gasless)</Text>
</View>
```

### 3. Provide Transaction Receipt

```typescript
After success:
- Show transaction signature
- Link to explorer
- Display timestamp
- Show amount sent
```

### 4. Handle Network Issues Gracefully

```typescript
try {
  await sendTransaction();
} catch (error) {
  if (isNetworkError(error)) {
    // Offer to retry
  } else {
    // Show specific error
  }
}
```

## Troubleshooting

### Transaction Fails Silently

Check Solana explorer for error details:

```
https://solscan.io/tx/[signature]?cluster=devnet
```

### "Insufficient funds for rent"

Smart wallet needs minimum SOL balance:

```typescript
// Request airdrop for rent (devnet only)
await connection.requestAirdrop(publicKey, 0.001 * LAMPORTS_PER_SOL);
```

### Paymaster Rejection

Verify paymaster configuration and API key in `.env`

## Next Steps

- Implement transaction history
- Add currency conversion
- Support other SPL tokens
- Implement scheduled transactions

## Resources

- [Solana Transaction Docs](https://docs.solana.com/developing/programming-model/transactions)
- [Lazorkit Paymaster Guide](https://docs.lazorkit.com/paymaster)
- [SPL Token Program](https://spl.solana.com/token)
