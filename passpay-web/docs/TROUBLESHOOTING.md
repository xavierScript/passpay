# 🔧 Troubleshooting Guide

Solutions to common issues when developing with LazorKit and PassPay Web.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Polyfill Errors](#polyfill-errors)
- [Connection Problems](#connection-problems)
- [Transaction Failures](#transaction-failures)
- [WebAuthn Issues](#webauthn-issues)
- [Build Errors](#build-errors)
- [Runtime Errors](#runtime-errors)

---

## Installation Issues

### ❌ Peer Dependency Conflicts

**Error:**

```
npm ERR! ERESOLVE could not resolve
npm ERR! peer react@"^18.0.0" from @lazorkit/wallet
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

### ❌ Module Not Found

**Error:**

```
Module not found: Can't resolve '@lazorkit/wallet'
```

**Solution:**
Install the correct package:

```bash
npm install @lazorkit/wallet
```

Make sure you're using the web package, not the mobile adapter:

```typescript
// ✅ Correct for web
import { useWallet } from "@lazorkit/wallet";

// ❌ Wrong - this is for React Native
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
```

---

### ❌ TypeScript Can't Find Types

**Error:**

```
Cannot find module '@lazorkit/wallet' or its corresponding type declarations
```

**Solution:**
Create a type declaration file:

```typescript
// types/lazorkit.d.ts
declare module "@lazorkit/wallet" {
  import { PublicKey, TransactionInstruction } from "@solana/web3.js";

  export function LazorkitProvider(props: {
    rpcUrl: string;
    portalUrl: string;
    paymasterConfig?: { paymasterUrl: string };
    children: React.ReactNode;
  }): JSX.Element;

  export function useWallet(): {
    connect: (options?: { feeMode?: string }) => Promise<WalletInfo>;
    disconnect: () => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    wallet: { smartWallet: string } | null;
    smartWalletPubkey: PublicKey | null;
    signAndSendTransaction: (options: SignOptions) => Promise<string>;
  };

  interface WalletInfo {
    credentialId?: string;
    smartWallet: string;
  }

  interface SignOptions {
    instructions: TransactionInstruction[];
    transactionOptions?: { feeToken?: string };
  }
}
```

---

## Polyfill Errors

### ❌ Buffer is Not Defined

**Error:**

```
ReferenceError: Buffer is not defined
```

**Cause:** Browser doesn't have Node.js `Buffer` global.

**Solution:**
Add Buffer polyfill in your providers:

```typescript
// app/providers.tsx
"use client";
import { useEffect } from "react";
import { Buffer } from "buffer";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Buffer) {
      window.Buffer = Buffer;
    }
  }, []);

  return <>{children}</>;
}
```

Also add the type declaration:

```typescript
// types/global.d.ts
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}
export {};
```

---

### ❌ Process is Not Defined

**Error:**

```
ReferenceError: process is not defined
```

**Solution:**
This usually occurs in older libraries. Add to `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve("process/browser"),
    };
    return config;
  },
};

export default nextConfig;
```

And install the package:

```bash
npm install process
```

---

## Connection Problems

### ❌ Wallet Won't Connect

**Symptoms:**

- Click "Connect" but nothing happens
- `isConnected` stays false
- No passkey prompt appears

**Possible Causes & Solutions:**

1. **Not using HTTPS:**
   WebAuthn requires HTTPS. In development, use HTTPS on`localhost`:

2. **Browser doesn't support WebAuthn:**
   Check browser compatibility:

   - Chrome 108+
   - Safari 16+
   - Firefox 119+
   - Edge 108+

3. **Missing LazorkitProvider:**
   Ensure your app is wrapped:

   ```typescript
   // app/layout.tsx
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <AppProviders>{children}</AppProviders>
         </body>
       </html>
     );
   }
   ```

---

### ❌ "NotAllowedError" on Connect

**Error:**

```
NotAllowedError: The operation either timed out or was not allowed.
```

**Cause:** User cancelled the passkey prompt or it timed out.

**Solution:**
This is user-initiated - they need to complete the authentication. Provide clear UI feedback:

```typescript
const handleConnect = async () => {
  try {
    await connect({ feeMode: "paymaster" });
  } catch (error) {
    if (error.message.includes("NotAllowedError")) {
      toast.error("You cancelled the passkey prompt. Please try again.");
    }
  }
};
```

---

### ❌ "PublicKeyCredential not supported"

**Error:**

```
PublicKeyCredential is not supported by this browser
```

**Solution:**
The browser doesn't support WebAuthn. Options:

1. Use a supported browser
2. Show a fallback message:

```typescript
useEffect(() => {
  if (!window.PublicKeyCredential) {
    setError(
      "Your browser doesn't support passkeys. Please use Chrome, Safari, or Firefox."
    );
  }
}, []);
```

---

## Transaction Failures

### ❌ "Transaction too large"

**Error:**

```
Transaction too large for paymaster
```

**Cause:** Too many instructions or large memo data.

**Solution:**
Reduce transaction size:

```typescript
// Limit memo size
if (message.length > 200) {
  toast.error("Message too long. Maximum 200 characters.");
  return;
}

// Split large operations into multiple transactions
```

---

### ❌ "Insufficient Balance"

**Error:**

```
Insufficient balance for this transaction
```

**Solution:**
Check balance before transacting:

```typescript
const { balance } = useSolBalance();

const handleTransfer = async () => {
  if (balance !== null && amount > balance) {
    toast.error(`Insufficient balance. You have ${balance.toFixed(4)} SOL`);
    return;
  }
  // ... continue with transfer
};
```

---

### ❌ "Signing failed"

**Error:**

```
Signing failed. Please try again.
```

**Possible Causes:**

1. **Not on HTTPS:**
   Passkey signing requires secure context.

2. **Passkey expired:**
   User may need to re-authenticate.

3. **Network issues:**
   Check internet connection.

**Solution:**

```typescript
catch (error) {
  if (error.message.includes("Signing failed")) {
    toast.error("Signing failed. Please ensure you're using HTTPS and try again.");
  }
}
```

---

### ❌ Transaction Timeout

**Error:**

```
Transaction confirmation timeout
```

**Solution:**
Retry with exponential backoff:

```typescript
const retryTransaction = async (fn: () => Promise<string>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

---

## WebAuthn Issues

### ❌ "SecurityError: The operation is insecure"

**Cause:** Not running on HTTPS.

**Solution:**

- Deploy to HTTPS for production

---

### ❌ Passkey Not Found

**Error:**

```
The passkey was not found on this device
```

**Cause:** User is on a different device than where they created the passkey.

**Solution:**
Passkeys sync via iCloud Keychain (Apple) or Google Password Manager. Ensure sync is enabled, or create a new passkey on the current device.

---

## Build Errors

### ❌ "use client" Error

**Error:**

```
You're importing a component that needs useState. It only works in a Client Component
```

**Solution:**
Add `"use client"` directive to components using React hooks:

```typescript
// components/MyComponent.tsx
"use client";
import { useState } from "react";

export function MyComponent() {
  const [state, setState] = useState(false);
  // ...
}
```

---

### ❌ Hydration Mismatch

**Error:**

```
Hydration failed because the initial UI does not match what was rendered on the server
```

**Cause:** Server and client render different content.

**Solution:**
Use dynamic imports for client-only components:

```typescript
import dynamic from "next/dynamic";

const WalletConnect = dynamic(
  () => import("@/components/WalletConnect").then((mod) => mod.WalletConnect),
  { ssr: false }
);
```

Or use `useEffect` for client-only code:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
```

---

## Runtime Errors

### ❌ "Cannot read properties of null (reading 'smartWalletPubkey')"

**Cause:** Accessing wallet before connection.

**Solution:**
Always check connection first:

```typescript
const { isConnected, smartWalletPubkey } = useWallet();

if (!isConnected || !smartWalletPubkey) {
  return <ConnectPrompt />;
}

// Now safe to use smartWalletPubkey
```

---

### ❌ "Invalid public key input"

**Cause:** Passing invalid address string to PublicKey constructor.

**Solution:**
Validate addresses before use:

```typescript
import { validateAddress } from "@/lib/services";

const pubkey = validateAddress(recipientInput);
if (!pubkey) {
  toast.error("Invalid Solana address");
  return;
}
```

---

## Getting Help

If you're still stuck:

1. **Check the console** - Browser DevTools often have more details
2. **Check network tab** - Look for failed RPC requests
3. **Try a different browser** - Rule out browser-specific issues
4. **Try creating another passkey**

### Useful Debug Code

```typescript
// Add to lib/debug.ts and import in providers
if (typeof window !== "undefined") {
  (window as any).debugLazorkit = {
    logWallet: () => {
      const wallet = localStorage.getItem("lazorkit_wallet");
      console.log("Stored wallet:", wallet);
    },
    clearWallet: () => {
      localStorage.removeItem("lazorkit_wallet");
      console.log("Wallet cleared");
    },
  };
}
```

Use in browser console:

```javascript
debugLazorkit.logWallet();
debugLazorkit.clearWallet();
```
