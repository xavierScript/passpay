# 🔧 Troubleshooting Guide

Solutions to common issues when developing with LazorKit and PassPay.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Polyfill Errors](#polyfill-errors)
- [Connection Problems](#connection-problems)
- [Transaction Failures](#transaction-failures)
- [Deep Linking Issues](#deep-linking-issues)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)

---

## Installation Issues

### ❌ Peer Dependency Conflicts

**Error:**

```
npm ERR! ERESOLVE could not resolve
npm ERR! peer @solana/web3.js@"^1.x" from @lazorkit/wallet-mobile-adapter
```

**Solution:**
Use the `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
```

Or create `.npmrc` file:

```
legacy-peer-deps=true
```

---

### ❌ Metro Bundler Can't Find Module

**Error:**

```
Unable to resolve module buffer from /node_modules/@solana/web3.js/...
```

**Solution:**
Ensure polyfills are installed and configured:

```bash
npm install buffer crypto-browserify react-native-get-random-values react-native-url-polyfill --legacy-peer-deps
```

Create `polyfills.ts`:

```typescript
import "react-native-get-random-values";
import { Buffer } from "buffer";
import "react-native-url-polyfill/auto";

global.Buffer = Buffer;
```

---

### ❌ TypeScript Can't Find Types

**Error:**

```
Cannot find module '@lazorkit/wallet-mobile-adapter' or its corresponding type declarations
```

**Solution:**
Create a type declaration file:

```typescript
// types/lazorkit.d.ts
declare module "@lazorkit/wallet-mobile-adapter" {
  import { PublicKey, TransactionInstruction } from "@solana/web3.js";

  export function LazorKitProvider(props: {
    config: LazorKitConfig;
    children: React.ReactNode;
  }): JSX.Element;

  export function useWallet(): {
    smartWalletPubkey: PublicKey | null;
    isConnecting: boolean;
    connect: (options?: { redirectUri?: string }) => Promise<void>;
    disconnect: () => Promise<void>;
    signAndSendTransaction: (options: SignOptions) => Promise<string>;
  };

  // ... additional types
}
```

---

## Polyfill Errors

### ❌ Buffer is Not Defined

**Error:**

```
ReferenceError: Buffer is not defined
```

**Cause:** Polyfills not loaded before Solana libraries.

**Solution:**

1. Create custom entry point `index.js`:

```javascript
import "./polyfills";
import "expo-router/entry";
```

2. Update `package.json`:

```json
{
  "main": "index.js"
}
```

3. Create `polyfills.ts`:

```typescript
import { Buffer } from "buffer";
global.Buffer = Buffer;
```

---

### ❌ Crypto.getRandomValues Not Found

**Error:**

```
crypto.getRandomValues is not a function
```

**Solution:**
Import `react-native-get-random-values` FIRST:

```typescript
// polyfills.ts - ORDER MATTERS!
import "react-native-get-random-values"; // Must be FIRST
import { Buffer } from "buffer";
// ... other imports
```

---

### ❌ URL Constructor Not Working

**Error:**

```
URL is not a constructor
```

**Solution:**
Add URL polyfill:

```typescript
import "react-native-url-polyfill/auto";
```

---

## Connection Problems

### ❌ Wallet Won't Connect

**Symptoms:**

- Browser opens but returns immediately
- `smartWalletPubkey` stays null

**Possible Causes & Solutions:**

1. **Missing WebBrowser completion:**

```typescript
// app/_layout.tsx - add at top
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();
```

2. **Wrong redirect URL:**

```typescript
// Check your redirect URL
console.log("Redirect URL:", getRedirectUrl());
// Should be: passpaymobile:// for standalone
// Or: exp://192.168.x.x:8081 for Expo Go
```

3. **Deep link not configured:**

```json
// app.json
{
  "expo": {
    "scheme": "passpaymobile"
  }
}
```

---

### ❌ "Session Expired" After Redirect

**Cause:** App was killed while in browser.

**Solution:**
Handle session restoration:

```typescript
useEffect(() => {
  const subscription = Linking.addEventListener("url", handleDeepLink);

  // Check for initial URL (cold start)
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });

  return () => subscription.remove();
}, []);
```

---

### ❌ Connection Works in Expo Go but Not Standalone

**Cause:** Different URL schemes.

**Solution:**
Dynamic redirect URL:

```typescript
// utils/redirect-url.ts
import Constants from "expo-constants";
import * as Linking from "expo-linking";

export function getRedirectUrl(path: string = ""): string {
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    return Linking.createURL(path);
  }

  return `passpaymobile://${path}`;
}
```

---

## Transaction Failures

### ❌ "Blockhash Not Found"

**Error:**

```
Error: Blockhash not found
```

**Cause:** Network latency or expired blockhash.

**Solution:**
The LazorKit SDK handles this automatically, but if building custom transactions:

```typescript
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
  "finalized"
);

// Use fresh blockhash
transaction.recentBlockhash = blockhash;
```

---

### ❌ "Insufficient Funds for Fee"

**Error:**

```
Transaction simulation failed: Insufficient funds for fee
```

**Solution:**
Enable gasless transactions:

```typescript
await signAndSendTransaction({
  instructions: [instruction],
  gasConfig: {
    type: "paymaster",
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
});
```

---

### ❌ "Transaction Too Large"

**Error:**

```
Transaction too large
```

**Cause:** Transaction exceeds 1232 bytes.

**Solutions:**

1. **Use Address Lookup Tables:**

```typescript
const lookupTableAccount = await connection.getAddressLookupTable(
  lookupTableAddress
);

await signAndSendTransaction({
  instructions,
  lookupTables: [lookupTableAccount.value],
});
```

2. **Split into multiple transactions:**

```typescript
// Break instructions into smaller batches
const batch1 = instructions.slice(0, 3);
const batch2 = instructions.slice(3);

await execute({ instructions: batch1 });
await execute({ instructions: batch2 });
```

---

### ❌ Stake Account Already Exists

**Error:**

```
Error: Create Account: account already exists
```

**Cause:** Using same seed for stake account.

**Solution:**
Use unique seeds:

```typescript
// Add timestamp for uniqueness
const seed = `stake:${Date.now()}`;

const stakeAccountPubkey = await PublicKey.createWithSeed(
  walletPubkey,
  seed,
  StakeProgram.programId
);
```

---

### ❌ "Custom Program Error"

**Error:**

```
custom program error: 0x1
```

**Debug Steps:**

1. **Check instruction order:**

```typescript
// Many programs expect specific order
const instructions = [
  createAccountIx, // First: create account
  initializeIx, // Second: initialize
  delegateIx, // Third: delegate
];
```

2. **Verify account ownership:**

```typescript
const accountInfo = await connection.getAccountInfo(pubkey);
console.log("Owner:", accountInfo?.owner.toBase58());
```

3. **Check Solana Explorer** for detailed logs:

```
https://explorer.solana.com/tx/YOUR_SIGNATURE?cluster=devnet
```

---

## Deep Linking Issues

### ❌ App Doesn't Open from Browser

**Cause:** Deep link scheme not registered.

**Solution:**

1. **For Expo (app.json):**

```json
{
  "expo": {
    "scheme": "passpaymobile"
  }
}
```

2. **For bare React Native (AndroidManifest.xml):**

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="passpaymobile" />
</intent-filter>
```

3. **Rebuild the app:**

```bash
npx expo prebuild --clean
npx expo run:android
```

---

### ❌ Multiple Instances of App

**Cause:** Android launches new instance on deep link.

**Solution:**
Add `launchMode` to AndroidManifest:

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">
```

---

## Build Errors

### ❌ Duplicate Classes (Android)

**Error:**

```
Duplicate class kotlin.collections.ArraysKt found in kotlin-stdlib-1.8.0
```

**Solution:**
Add to `android/build.gradle`:

```gradle
buildscript {
    ext {
        kotlinVersion = "1.9.0"
    }
}
```

---

### ❌ Minimum SDK Version Error

**Error:**

```
uses-sdk:minSdkVersion 21 cannot be smaller than 24
```

**Solution:**
Update `android/build.gradle`:

```gradle
android {
    defaultConfig {
        minSdkVersion 24
    }
}
```

---

### ❌ Jetifier Errors

**Error:**

```
AndroidX dependencies conflicts
```

**Solution:**

```bash
npx expo prebuild --clean
cd android && ./gradlew clean
cd .. && npx expo run:android
```

---

## Runtime Errors

### ❌ "Cannot Read Property of Null" (PublicKey)

**Error:**

```
Cannot read property 'toBase58' of null
```

**Cause:** Accessing `smartWalletPubkey` before connection.

**Solution:**
Always check connection status:

```typescript
const { smartWalletPubkey } = useWallet();

// Guard clause
if (!smartWalletPubkey) {
  return <ConnectPrompt />;
}

// Safe to use
const address = smartWalletPubkey.toBase58();
```

---

### ❌ Infinite Re-renders

**Cause:** useEffect dependencies or state updates in render.

**Solution:**

```typescript
// ❌ BAD: Creates new array each render
useEffect(() => {
  // ...
}, [{ a: 1 }]); // Object in deps

// ✅ GOOD: Stable primitive
const a = 1;
useEffect(() => {
  // ...
}, [a]);
```

---

### ❌ Memory Leak Warning

**Error:**

```
Can't perform a React state update on an unmounted component
```

**Solution:**
Clean up async operations:

```typescript
useEffect(() => {
  let isMounted = true;

  async function fetchData() {
    const data = await getData();
    if (isMounted) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

---

## Debugging Tips

### Enable Verbose Logging

```typescript
// Add to your app entry
if (__DEV__) {
  // Log all RPC requests
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    console.log("Fetch:", args[0]);
    return originalFetch(...args);
  };
}
```

### Transaction Simulation

```typescript
// Simulate before sending
try {
  const simulation = await connection.simulateTransaction(transaction);

  if (simulation.value.err) {
    console.error("Simulation failed:", simulation.value.err);
    console.log("Logs:", simulation.value.logs);
  }
} catch (e) {
  console.error("Simulation error:", e);
}
```

### Check Account State

```typescript
async function debugAccount(pubkey: PublicKey) {
  const info = await connection.getAccountInfo(pubkey);

  console.log({
    exists: info !== null,
    owner: info?.owner.toBase58(),
    lamports: info?.lamports,
    dataLength: info?.data.length,
    executable: info?.executable,
  });
}
```

---

## Getting Help

If you're still stuck:

1. **Check LazorKit Discord** - Community support
2. **Solana Stack Exchange** - Technical questions
3. **GitHub Issues** - Bug reports
4. **LazorKit Documentation** - [docs.lazorkit.com](https://docs.lazorkit.com)

### When Reporting Issues

Include:

- OS and device info
- LazorKit SDK version
- Expo/React Native version
- Full error message and stack trace
- Steps to reproduce
- Minimal code example

---

## Related Documentation

- [Installation Guide](./INSTALLATION.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
