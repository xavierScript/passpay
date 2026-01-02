# Tutorial 1: Creating a Passkey-Based Wallet

**Time to complete: 15-20 minutes**

Learn how to implement passwordless wallet authentication using LazorKit's passkey integration. By the end of this tutorial, you'll understand how passkeys work and have a fully functional wallet connection flow.

---

## 📚 Table of Contents

1. [What are Passkeys?](#what-are-passkeys)
2. [How LazorKit Passkeys Work](#how-lazorkit-passkeys-work)
3. [Prerequisites](#prerequisites)
4. [Step 1: Setup the Provider](#step-1-setup-the-provider)
5. [Step 2: Create the Connection Screen](#step-2-create-the-connection-screen)
6. [Step 3: Implement Connect Function](#step-3-implement-connect-function)
7. [Step 4: Display Wallet Information](#step-4-display-wallet-information)
8. [Step 5: Handle Disconnect](#step-5-handle-disconnect)
9. [Complete Code Example](#complete-code-example)
10. [How It Works Under the Hood](#how-it-works-under-the-hood)
11. [Testing Your Implementation](#testing-your-implementation)

---

## What are Passkeys?

Passkeys are a modern authentication standard (WebAuthn) that replaces passwords and seed phrases with biometric authentication:

| Traditional Wallet            | Passkey Wallet                     |
| ----------------------------- | ---------------------------------- |
| 12-24 word seed phrase        | Device biometrics (FaceID/TouchID) |
| Write down and store securely | Stored in device Secure Enclave    |
| Can be lost or stolen         | Bound to your biometrics           |
| Same phrase on all devices    | Synced via iCloud/Google           |
| 5+ minute setup               | 30 second setup                    |

### Why This Matters

- **Users don't need to understand crypto** - They just use their fingerprint
- **No seed phrase anxiety** - Nothing to write down or lose
- **Hardware-level security** - Private keys never leave the Secure Enclave
- **Cross-device sync** - Passkeys sync via iCloud Keychain / Google Password Manager

---

## How LazorKit Passkeys Work

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PASSKEY AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

    Your App                    LazorKit Portal                  Device
       │                              │                             │
       │  1. connect()                │                             │
       │─────────────────────────────>│                             │
       │                              │                             │
       │                              │  2. Request biometric       │
       │                              │─────────────────────────────>│
       │                              │                             │
       │                              │  3. User authenticates      │
       │                              │     (FaceID/TouchID)        │
       │                              │<─────────────────────────────│
       │                              │                             │
       │  4. Redirect with wallet     │                             │
       │<─────────────────────────────│                             │
       │                              │                             │
       │  5. smartWalletPubkey ready! │                             │
       ▼                              ▼                             ▼
```

### Key Concepts

| Concept           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| **Smart Wallet**  | A Program Derived Address (PDA) controlled by your passkey |
| **Portal**        | LazorKit's web interface for authentication                |
| **Redirect URL**  | Deep link back to your app after authentication            |
| **Credential ID** | Unique identifier for the passkey                          |

---

## Prerequisites

Before starting this tutorial, ensure you have:

- ✅ Completed the [Installation Guide](../INSTALLATION.md)
- ✅ `LazorKitProvider` wrapping your app
- ✅ Polyfills configured correctly
- ✅ Deep linking scheme configured in `app.json`

---

## Step 1: Setup the Provider

First, ensure your root layout has the `LazorKitProvider`:

```typescript
// app/_layout.tsx
import "../polyfills"; // ⚠️ MUST be first!

import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Required for completing the auth session
WebBrowser.maybeCompleteAuthSession();

const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      configPaymaster={LAZORKIT_CONFIG.configPaymaster}
      isDebug={true}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </LazorKitProvider>
  );
}
```

### Why `maybeCompleteAuthSession()`?

When the user returns from the LazorKit portal (browser), Expo needs to know the auth session is complete. This function handles that cleanup.

---

## Step 2: Create the Connection Screen

Create a new screen for wallet connection:

```typescript
// app/(tabs)/index.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WalletScreen() {
  const {
    connect, // Function to initiate connection
    disconnect, // Function to disconnect
    isConnected, // Boolean: is wallet connected?
    smartWalletPubkey, // PublicKey of the smart wallet
    isConnecting, // Boolean: is connection in progress?
  } = useWallet();

  const [isLoading, setIsLoading] = useState(false);

  // We'll implement these next...
  const handleConnect = async () => {
    /* ... */
  };
  const handleDisconnect = async () => {
    /* ... */
  };

  return <View style={styles.container}>{/* UI will go here */}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 20,
  },
});
```

### The `useWallet` Hook Returns

| Property                 | Type                | Description                       |
| ------------------------ | ------------------- | --------------------------------- |
| `connect`                | `function`          | Initiates passkey authentication  |
| `disconnect`             | `function`          | Clears the wallet session         |
| `isConnected`            | `boolean`           | Whether a wallet is connected     |
| `smartWalletPubkey`      | `PublicKey \| null` | The wallet's Solana address       |
| `isConnecting`           | `boolean`           | Loading state during connection   |
| `signMessage`            | `function`          | Signs arbitrary messages          |
| `signAndSendTransaction` | `function`          | Signs and broadcasts transactions |

---

## Step 3: Implement Connect Function

Now implement the connection logic:

```typescript
import { getRedirectUrl } from "@/utils/redirect-url";

const handleConnect = async () => {
  // Prevent multiple connection attempts
  if (isConnecting || isLoading) return;

  try {
    setIsLoading(true);

    await connect({
      // redirectUrl tells LazorKit where to return after auth
      // This MUST match your app's URL scheme
      redirectUrl: getRedirectUrl(),

      // Called when authentication succeeds
      onSuccess: (wallet) => {
        console.log("✅ Connected successfully!");
        console.log("Smart Wallet:", wallet.smartWallet);
        console.log("Credential ID:", wallet.credentialId);
        console.log("Platform:", wallet.platform);
        setIsLoading(false);
      },

      // Called when authentication fails
      onFail: (error) => {
        console.error("❌ Connection failed:", error);
        Alert.alert(
          "Connection Failed",
          error?.message || "Unable to connect wallet"
        );
        setIsLoading(false);
      },
    });
  } catch (error: any) {
    console.error("Error during connect:", error);
    Alert.alert("Error", error?.message || "Failed to connect");
    setIsLoading(false);
  }
};
```

### The `connect` Options

```typescript
interface ConnectOptions {
  // REQUIRED: Deep link URL to return to your app
  redirectUrl: string;

  // OPTIONAL: Called with wallet info on success
  onSuccess?: (wallet: WalletInfo) => void;

  // OPTIONAL: Called with error on failure
  onFail?: (error: Error) => void;
}
```

### The `WalletInfo` Object

When connection succeeds, you receive:

```typescript
interface WalletInfo {
  // Unique WebAuthn credential ID (Base64)
  credentialId: string;

  // Raw public key bytes of the passkey
  passkeyPubkey: number[];

  // ⭐ YOUR SOLANA WALLET ADDRESS (Base58)
  // Use this to receive funds and display to users
  smartWallet: string;

  // Internal PDA for device management
  walletDevice: string;

  // Origin platform ('android' | 'ios')
  platform: string;
}
```

---

## Step 4: Display Wallet Information

Show the connected wallet state:

```typescript
return (
  <View style={styles.container}>
    <Text style={styles.title}>PassPay Wallet</Text>

    {isConnected && smartWalletPubkey ? (
      // ✅ CONNECTED STATE
      <View style={styles.walletCard}>
        <Text style={styles.label}>Your Wallet Address</Text>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
          {smartWalletPubkey.toBase58()}
        </Text>
        <Text style={styles.successBadge}>✓ Connected with Passkey</Text>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>
    ) : (
      // ❌ NOT CONNECTED STATE
      <View style={styles.connectContainer}>
        <Text style={styles.description}>
          Create or connect your wallet using biometric authentication (FaceID,
          TouchID, or fingerprint)
        </Text>

        <TouchableOpacity
          style={[
            styles.connectButton,
            (isConnecting || isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleConnect}
          disabled={isConnecting || isLoading}
        >
          {isConnecting || isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.connectButtonText}>
              Connect with Passkey 🔐
            </Text>
          )}
        </TouchableOpacity>
      </View>
    )}
  </View>
);
```

### Display Address Helpers

Create a utility to truncate long addresses:

```typescript
// utils/helpers.ts
export function truncateAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Usage:
// truncateAddress("4UjfJZ8K1234567890abcdefghijklmnopqrstuvwxyz")
// Returns: "4Ujf...wxyz"
```

---

## Step 5: Handle Disconnect

Implement the disconnect function:

```typescript
const handleDisconnect = async () => {
  try {
    await disconnect({
      onSuccess: () => {
        console.log("👋 Disconnected successfully");
      },
      onFail: (error) => {
        console.error("Disconnect failed:", error);
        Alert.alert("Error", "Failed to disconnect");
      },
    });
  } catch (error: any) {
    console.error("Error during disconnect:", error);
    Alert.alert("Error", error?.message || "Failed to disconnect");
  }
};
```

### What Disconnect Does

- Clears the local wallet session
- Resets `isConnected` to `false`
- Resets `smartWalletPubkey` to `null`
- Does NOT delete the passkey (user can reconnect later)

---

## Complete Code Example

Here's the full implementation from PassPay:

```typescript
// app/(tabs)/index.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getRedirectUrl } from "@/utils/redirect-url";

export default function HomeScreen() {
  const { connect, isConnected, smartWalletPubkey, disconnect, isConnecting } =
    useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (isConnecting || isLoading) return;

    try {
      setIsLoading(true);
      await connect({
        redirectUrl: getRedirectUrl(),
        onSuccess: (wallet) => {
          console.log("Connected:", wallet.smartWallet);
          setIsLoading(false);
        },
        onFail: (error) => {
          console.error("Connection failed:", error);
          Alert.alert("Connection Failed", error?.message || "Unknown error");
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Error connecting:", error);
      Alert.alert("Error", error?.message || "Failed to connect");
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({
        onSuccess: () => console.log("Disconnected"),
        onFail: (error) => {
          console.error("Disconnect failed:", error);
          Alert.alert("Error", "Failed to disconnect");
        },
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to disconnect");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PassPay</Text>
        <Text style={styles.subtitle}>Passkey-Powered Solana Wallet</Text>

        {isConnected && smartWalletPubkey ? (
          <View style={styles.walletContainer}>
            <View style={styles.walletCard}>
              <Text style={styles.label}>Wallet Address</Text>
              <Text
                style={styles.address}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {smartWalletPubkey.toBase58()}
              </Text>
              <Text style={styles.successText}>✓ Connected with Passkey</Text>
            </View>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectContainer}>
            <Text style={styles.description}>
              Create or connect your wallet using biometric authentication
            </Text>

            <TouchableOpacity
              style={[
                styles.connectButton,
                (isConnecting || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleConnect}
              disabled={isConnecting || isLoading}
            >
              {isConnecting || isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.connectButtonText}>
                  Connect with Passkey 🔐
                </Text>
              )}
            </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  walletContainer: {
    gap: 16,
  },
  walletCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  label: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  address: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "monospace",
  },
  successText: {
    color: "#14F195",
    marginTop: 12,
    fontSize: 14,
  },
  connectContainer: {
    alignItems: "center",
    gap: 24,
  },
  description: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: "#9945FF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  disconnectButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ff4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  disconnectText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "500",
  },
});
```

---

## How It Works Under the Hood

### 1. Passkey Creation (First Time)

```
User taps "Connect"
    ↓
Browser opens LazorKit Portal
    ↓
Portal calls navigator.credentials.create()
    ↓
Device shows biometric prompt
    ↓
Secure Enclave generates keypair
    ↓
Public key sent to LazorKit
    ↓
Smart Wallet PDA created on-chain
    ↓
Redirect back to app with wallet info
```

### 2. Passkey Authentication (Returning User)

```
User taps "Connect"
    ↓
Browser opens LazorKit Portal
    ↓
Portal calls navigator.credentials.get()
    ↓
Device shows biometric prompt
    ↓
Secure Enclave signs challenge
    ↓
Signature verified
    ↓
Redirect back to app with wallet info
```

### 3. The Smart Wallet

LazorKit creates a **Program Derived Address (PDA)** for each passkey:

```
┌─────────────────────────────────────────┐
│           SMART WALLET (PDA)             │
├─────────────────────────────────────────┤
│ • Controlled by LazorKit program        │
│ • Authorized by your passkey            │
│ • Can hold SOL and tokens               │
│ • Supports gasless transactions         │
│ • Can be recovered with passkey sync    │
└─────────────────────────────────────────┘
```

---

## Testing Your Implementation

### Test on Physical Device (Required)

Passkeys require biometric hardware:

- **iOS**: FaceID or TouchID
- **Android**: Fingerprint scanner

⚠️ Passkeys do NOT work in simulators/emulators!

### Test Checklist

- [ ] Connect button opens browser
- [ ] Biometric prompt appears
- [ ] Successful redirect back to app
- [ ] Wallet address displays correctly
- [ ] Disconnect clears the session
- [ ] Reconnecting uses existing passkey

### Debug Tips

1. **Enable debug mode** in `LazorKitProvider`:

   ```typescript
   <LazorKitProvider isDebug={true} ... />
   ```

2. **Check redirect URL** matches your scheme:

   ```typescript
   console.log("Redirect URL:", getRedirectUrl());
   ```

3. **Monitor Metro logs** for connection events

---

## 🎉 What You've Learned

- ✅ How passkeys replace seed phrases
- ✅ The authentication flow between your app and LazorKit
- ✅ Implementing `connect()` with proper callbacks
- ✅ Displaying wallet information
- ✅ Handling disconnect
- ✅ The smart wallet architecture

---

## Next Steps

Continue to [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md) to learn how to send SOL without paying gas fees!
