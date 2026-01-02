# 🔧 Installation & Setup Guide

A comprehensive guide to setting up LazorKit SDK in a React Native (Expo) project from scratch.

---

## Table of Contents

1. [Create New Expo Project](#1-create-new-expo-project)
2. [Install Dependencies](#2-install-dependencies)
3. [Configure Polyfills](#3-configure-polyfills)
4. [Setup Entry Point](#4-setup-entry-point)
5. [Configure Deep Linking](#5-configure-deep-linking)
6. [Setup LazorKit Provider](#6-setup-lazorkit-provider)
7. [Verify Installation](#7-verify-installation)

---

## 1. Create New Expo Project

If you're starting fresh, create a new Expo project:

```bash
# Create new Expo project with TypeScript
npx create-expo-app@latest my-lazorkit-app -t expo-template-blank-typescript

cd my-lazorkit-app
```

---

## 2. Install Dependencies

### Core Dependencies

```bash
# LazorKit SDK for React Native
npm install @lazorkit/wallet-mobile-adapter

# Solana Web3.js
npm install @solana/web3.js

# Required polyfills for React Native
npm install react-native-get-random-values react-native-url-polyfill buffer

# Expo packages for web browser and linking
npx expo install expo-web-browser expo-linking expo-constants
```

### Complete package.json dependencies

Your `package.json` should include these key dependencies:

```json
{
  "dependencies": {
    "@lazorkit/wallet-mobile-adapter": "^1.0.0",
    "@solana/web3.js": "^1.98.0",
    "buffer": "^6.0.3",
    "react-native-get-random-values": "^1.11.0",
    "react-native-url-polyfill": "^2.0.0",
    "expo-web-browser": "~15.0.10",
    "expo-linking": "~8.0.11",
    "expo-constants": "~18.0.12"
  }
}
```

---

## 3. Configure Polyfills

### Why Polyfills?

React Native doesn't include Node.js built-ins that Solana libraries expect (like `Buffer`, `crypto.getRandomValues`, and `URL`). We need to polyfill these before any Solana code runs.

### Create `polyfills.ts`

Create a new file at the project root:

```typescript
// polyfills.ts
/**
 * Polyfills for React Native / Expo
 *
 * ⚠️ CRITICAL: This file must be imported FIRST in the app entry point
 * before any other imports that might use Buffer, crypto, or URL.
 */

import { Buffer } from "buffer";

// Buffer polyfill - must be set before any Solana libraries are imported
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

// Crypto polyfill for getRandomValues (required for keypair generation)
import "react-native-get-random-values";

// URL polyfill (required for RPC connections)
import "react-native-url-polyfill/auto";
```

### ⚠️ Import Order Matters!

The polyfills **MUST** be imported before any Solana or LazorKit code:

```typescript
// ✅ CORRECT - polyfills first
import "../polyfills";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

// ❌ WRONG - Solana imported before polyfills
import { Connection } from "@solana/web3.js";
import "../polyfills"; // Too late!
```

---

## 4. Setup Entry Point

### Why a Custom Entry Point?

Expo Router's default entry point loads before we can configure polyfills. We need a custom entry point to ensure polyfills load first.

### Create `index.js`

Create or modify `index.js` at the project root:

```javascript
// index.js
/**
 * Custom entry point for the app
 *
 * This file ensures polyfills are loaded BEFORE expo-router initializes,
 * which is critical for Solana libraries that require Buffer.
 */

// Load polyfills first
import "./polyfills";

// Then load the expo-router entry
import "expo-router/entry";
```

### Update `package.json`

Make sure `package.json` points to the custom entry:

```json
{
  "main": "index.js"
}
```

---

## 5. Configure Deep Linking

LazorKit uses deep links to redirect back to your app after authentication.

### Update `app.json`

Add a custom URL scheme:

```json
{
  "expo": {
    "name": "My LazorKit App",
    "slug": "my-lazorkit-app",
    "scheme": "mylazorkitapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.mylazorkitapp",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Use Face ID to authenticate your wallet"
      }
    },
    "android": {
      "package": "com.yourcompany.mylazorkitapp",
      "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"]
    },
    "plugins": ["expo-router", "expo-web-browser"]
  }
}
```

### Create Redirect URL Helper

Create `utils/redirect-url.ts`:

```typescript
// utils/redirect-url.ts
/**
 * Get the correct redirect URL based on the environment
 * - Expo Go: Uses exp:// scheme with slug
 * - Standalone Build: Uses custom scheme
 */
import Constants from "expo-constants";
import * as Linking from "expo-linking";

export function getRedirectUrl(path: string = ""): string {
  // Check if running in Expo Go
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    // Use Expo's deep linking for Expo Go app
    // Format: exp://your-ip:8081/--/path
    const url = Linking.createURL(path);
    console.log("📱 Using Expo Go redirect URL:", url);
    return url;
  } else {
    // Use custom scheme for standalone builds
    // Must match "scheme" in app.json
    const customUrl = `mylazorkitapp://${path}`;
    console.log("🏗️ Using standalone redirect URL:", customUrl);
    return customUrl;
  }
}
```

---

## 6. Setup LazorKit Provider

### Wrap Your App

In your root layout file (`app/_layout.tsx` for Expo Router):

```typescript
// app/_layout.tsx
// ⚠️ Polyfills MUST be imported first!
import "../polyfills";

import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Required for web browser authentication flow
WebBrowser.maybeCompleteAuthSession();

// LazorKit Configuration
const LAZORKIT_CONFIG = {
  // Solana RPC endpoint
  rpcUrl: "https://api.devnet.solana.com",

  // LazorKit portal for authentication
  portalUrl: "https://portal.lazor.sh",

  // Paymaster configuration for gasless transactions
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    // apiKey: "YOUR_API_KEY" // Optional - for production
  },
};

export default function RootLayout() {
  return (
    <LazorKitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      configPaymaster={LAZORKIT_CONFIG.configPaymaster}
      isDebug={true} // Enable console logging for development
    >
      <Stack>
        <Stack.Screen name="index" />
      </Stack>
    </LazorKitProvider>
  );
}
```

### Configuration Options

| Option            | Type      | Description                                              |
| ----------------- | --------- | -------------------------------------------------------- |
| `rpcUrl`          | `string`  | Solana RPC endpoint URL                                  |
| `portalUrl`       | `string`  | LazorKit portal URL (default: `https://portal.lazor.sh`) |
| `configPaymaster` | `object`  | Paymaster configuration for gasless transactions         |
| `isDebug`         | `boolean` | Enable debug logging                                     |

### Default Configuration Values

```typescript
// Use these defaults for quick Devnet integration
const DEFAULT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    // apiKey: "YOUR_API_KEY" // Optional
  },
};
```

---

## 7. Verify Installation

Create a simple test screen to verify everything works:

```typescript
// app/index.tsx
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { getRedirectUrl } from "../utils/redirect-url";

export default function TestScreen() {
  const { connect, isConnected, smartWalletPubkey, isConnecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connect({
        redirectUrl: getRedirectUrl(),
        onSuccess: (wallet) => {
          console.log("✅ Connected:", wallet.smartWallet);
        },
        onFail: (error) => {
          console.error("❌ Connection failed:", error);
        },
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LazorKit Test</Text>

      {isConnected && smartWalletPubkey ? (
        <View>
          <Text style={styles.success}>✅ Connected!</Text>
          <Text style={styles.address}>{smartWalletPubkey.toBase58()}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={handleConnect}
          disabled={isConnecting}
        >
          <Text style={styles.buttonText}>
            {isConnecting ? "Connecting..." : "Connect with Passkey"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "#9945FF", padding: 16, borderRadius: 12 },
  buttonText: { color: "white", fontWeight: "bold" },
  success: { fontSize: 18, color: "green", marginBottom: 10 },
  address: { fontSize: 12, fontFamily: "monospace" },
});
```

### Run and Test

```bash
npx expo start
```

1. Open the app on your device
2. Tap "Connect with Passkey"
3. Complete biometric authentication in the browser
4. You should see "✅ Connected!" with your wallet address

---

## ✅ Installation Complete!

You now have a fully configured LazorKit project. Continue to the tutorials:

- [Tutorial 1: Passkey Wallet](./tutorials/01-PASSKEY_WALLET.md) - Deep dive into authentication
- [Tutorial 2: Gasless Transactions](./tutorials/02-GASLESS_TRANSACTIONS.md) - Send transactions without gas

---

## 📋 Installation Checklist

- [ ] Created Expo project
- [ ] Installed `@lazorkit/wallet-mobile-adapter`
- [ ] Installed polyfill packages
- [ ] Created `polyfills.ts`
- [ ] Created custom `index.js` entry point
- [ ] Configured URL scheme in `app.json`
- [ ] Created redirect URL helper
- [ ] Wrapped app with `LazorKitProvider`
- [ ] Verified connection works on device
