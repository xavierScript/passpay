# Tutorial 1: Creating a Passkey-Based Wallet

**Time to complete: 15-20 minutes**

Learn how to implement passwordless wallet authentication using LazorKit's passkey integration. By the end of this tutorial, you'll understand how passkeys work and have a fully functional wallet connection flow.

---

## 📚 Table of Contents

1. [What are Passkeys?](#what-are-passkeys)
2. [How LazorKit Passkeys Work](#how-lazorkit-passkeys-work)
3. [Prerequisites](#prerequisites)
4. [Step 1: Setup the Provider](#step-1-setup-the-provider)
5. [Step 2: Create the Login Page](#step-2-create-the-login-page)
6. [Step 3: Implement Connect Function](#step-3-implement-connect-function)
7. [Step 4: Display Wallet Information](#step-4-display-wallet-information)
8. [How It Works Under the Hood](#how-it-works-under-the-hood)
9. [Testing Your Implementation](#testing-your-implementation)

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
- **Native browser support** - Works in Chrome, Safari, Firefox, Edge

---

## Prerequisites

Before starting this tutorial, ensure you have:

- ✅ Completed the [Installation Guide](../INSTALLATION.md)
- ✅ A modern browser (Chrome 108+, Safari 16+, Firefox 119+)
- ✅ Running on `localhost` or HTTPS (WebAuthn requirement)

---

## Step 1: Setup the Provider

First, ensure your root layout has the `LazorkitProvider`:

```typescript
// app/providers.tsx
"use client";
import React, { useEffect } from "react";
import { LazorkitProvider } from "@lazorkit/wallet";
import { Buffer } from "buffer";
import { Toaster } from "react-hot-toast";

const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Buffer polyfill for browser
    if (typeof window !== "undefined" && !window.Buffer) {
      window.Buffer = Buffer;
    }
  }, []);

  return (
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      {children}
      <Toaster position="top-right" />
    </LazorkitProvider>
  );
}
```

_Listing 1-1: Setting up the LazorkitProvider with configuration_

This code sets up the foundation for passkey authentication. Let's break it down line by line:

The `"use client"` directive at the top tells Next.js this is a client component. This is necessary because LazorKit uses browser APIs like WebAuthn that don't exist on the server. Next are the imports. One is of particular concern here:

```typescript
import { LazorkitProvider } from "@lazorkit/wallet";
```

We import `LazorkitProvider`, which is a React context provider that makes wallet functionality available throughout your app. Any component that needs wallet access must be wrapped by this provider.

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

The configuration object contains three essential URLs:

- `rpcUrl`: The Solana RPC endpoint for blockchain communication (we use Devnet for testing in this case)
- `portalUrl`: LazorKit's authentication portal where passkey ceremonies happen
- `paymasterUrl`: The service that sponsors gas fees for gasless transactions.

Moving on to the next line, we have:

```typescript
useEffect(() => {
  if (typeof window !== "undefined" && !window.Buffer) {
    window.Buffer = Buffer;
  }
}, []);
```

This `useEffect` hook adds a Buffer polyfill to the browser's window object. Solana's web3.js library expects Node.js's Buffer class, which browsers don't have natively. In other words, we need to add this buffer class. We then check for `window` first to avoid errors during server-side rendering. Moving on, we need to have our app with the AppProviders as Listing 1-2 illustrates.

### Wrap Your App

In your `layout.tsx`, do this:

```typescript
// app/layout.tsx
import { AppProviders } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

_Listing 1-2: Wrapping your application with AppProviders_

This is the root layout that wraps your entire Next.js application. The key line is:

```typescript
<AppProviders>{children}</AppProviders>
```

By wrapping `{children}` with `AppProviders`, every page and component in your app gains access to the wallet context via the `useWallet` hook. Without this wrapper, calling `useWallet()` would throw an error.

---

## Step 2: Create the Login Page

Now we create a login page for wallet connection:

```typescript
// app/(auth)/login/page.tsx
"use client";
import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const {
    connect, // Function to initiate connection
    isConnected, // Boolean: is wallet connected?
    isConnecting, // Boolean: is connection in progress?
    wallet, // Wallet info (smartWallet address)
  } = useWallet();

  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      router.push("/transfer");
    }
  }, [isConnected, wallet, router]);

  // We'll implement this next...
  const handleConnect = async () => {
    /* ... */
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Welcome to PassPay
        </h1>

        {/* Connection button will go here */}
      </div>
    </div>
  );
}
```

_Listing 1-3: Basic login page structure with useWallet hook_

This code creates the foundation for our login page. Let's examine the key parts:

```typescript
const { connect, isConnected, isConnecting, wallet } = useWallet();
```

The `useWallet` hook is the primary interface to LazorKit. We destructure four essential properties:

- `connect`: An async function that triggers the passkey authentication flow
- `isConnected`: A boolean that tells us if a wallet session exists
- `isConnecting`: A boolean that's `true` during the authentication process
- `wallet`: An object containing the connected wallet's `smartWallet` address

Let's observe the next line, shall we?

```typescript
useEffect(() => {
  if (isConnected && wallet?.smartWallet) {
    router.push("/transfer");
  }
}, [isConnected, wallet, router]);
```

This effect runs whenever connection state changes. If the user is already connected (perhaps from a previous session stored in the browser), we automatically redirect them to the main app. The optional chaining (`wallet?.smartWallet`) safely handles cases where `wallet` might be null.

### The `useWallet` Hook Returns

| Property                 | Type                      | Description                       |
| ------------------------ | ------------------------- | --------------------------------- |
| `connect`                | `function`                | Initiates passkey authentication  |
| `disconnect`             | `function`                | Clears the wallet session         |
| `isConnected`            | `boolean`                 | Whether a wallet is connected     |
| `wallet`                 | `{ smartWallet: string }` | Wallet address info               |
| `smartWalletPubkey`      | `PublicKey \| null`       | The wallet's Solana PublicKey     |
| `isConnecting`           | `boolean`                 | Loading state during connection   |
| `signAndSendTransaction` | `function`                | Signs and broadcasts transactions |

---

## Step 3: Implement Connect Function

It is time to add the connection logic:

```typescript
const handleConnect = async () => {
  setError(null);

  try {
    // Connect with paymaster mode for gasless transactions
    const info = await connect({ feeMode: "paymaster" });

    if (info?.credentialId) {
      // Optionally store credential for later use
      console.log("Credential ID:", info.credentialId);
    }

    toast.success("Wallet connected! 🎉");
    router.push("/transfer");
  } catch (e: unknown) {
    const err = e as Error;
    const msg = err?.message || "Connection failed";
    setError(msg);

    // User-friendly error messages
    if (msg.includes("NotAllowedError")) {
      toast.error("You cancelled the passkey prompt.");
    } else if (msg.includes("PublicKeyCredential")) {
      toast.error("Your browser does not support passkeys.");
    } else {
      toast.error("Login failed. Please try again.");
    }
  }
};
```

_Listing 1-4: The handleConnect function that initiates passkey authentication_

This function handles the entire connection flow. Let's walk through it:

```typescript
const info = await connect({ feeMode: "paymaster" });
```

The `connect` function opens LazorKit's portal in the browser, triggering the WebAuthn ceremony. The `feeMode: "paymaster"` option tells LazorKit that future transactions should be gasless, meaning the paymaster will sponsor fees. This returns a `WalletInfo` object containing the new wallet's details.

```typescript
if (info?.credentialId) {
  console.log("Credential ID:", info.credentialId);
}
```

The `credentialId` is a unique identifier for this passkey. You might store this for analytics or to identify returning users. The same passkey always produces the same wallet address.

```typescript
if (msg.includes("NotAllowedError")) {
  toast.error("You cancelled the passkey prompt.");
}
```

Error handling is crucial for good UX. `NotAllowedError` means the user dismissed the biometric prompt—we show a friendly message rather than a cryptic error code.

### Understanding `connect()` Options

There is a minor detail we should know about the `feeMode`:

```typescript
await connect({
  feeMode: "paymaster", // Gasless transactions (recommended)
  // feeMode: "self",    // User pays gas fees
});
```

| Fee Mode    | Description                           |
| ----------- | ------------------------------------- |
| `paymaster` | LazorKit sponsors transaction fees    |
| `self`      | User pays fees from their SOL balance |

So, you choose... depending on what you want your app to do.

---

## Step 4: Display Wallet Information

Build the complete login UI:

```typescript
// app/(auth)/login/page.tsx
"use client";
import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnected, isConnecting, wallet } = useWallet();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      router.push("/transfer");
    }
  }, [isConnected, wallet, router]);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect({ feeMode: "paymaster" });
      toast.success("Wallet connected! 🎉");
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err?.message || "Connection failed";
      setError(msg);

      if (msg.includes("NotAllowedError")) {
        toast.error("You cancelled the passkey prompt.");
      } else if (msg.includes("PublicKeyCredential")) {
        toast.error("Your browser does not support passkeys.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔐 PassPay</h1>
          <p className="text-gray-400">
            No seed phrases. Just your biometrics.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-[#14F195]">✓</span>
              <span>No passwords or seed phrases</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-[#14F195]">✓</span>
              <span>Hardware-level security</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-[#14F195]">✓</span>
              <span>Syncs across your devices</span>
            </div>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-4 px-6 bg-[#9945FF] hover:bg-[#8035E0] 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-semibold rounded-xl transition-colors"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Connecting...
              </span>
            ) : (
              "✨ Continue with Passkey"
            )}
          </button>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Powered by LazorKit • Your device is your wallet
          </p>

          {/* Error Display */}
          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}

          {/* Success State */}
          {wallet?.smartWallet && (
            <div className="mt-4 p-4 rounded-lg bg-[#14F195]/10 border border-[#14F195]/20">
              <p className="text-sm text-[#14F195] font-semibold">
                ✓ Wallet Created!
              </p>
              <p className="text-xs text-gray-400 mt-1 font-mono break-all">
                {wallet.smartWallet}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## How It Works Under the Hood

### The WebAuthn Flow

1. **User clicks "Connect"**

   - Your app calls `connect({ feeMode: "paymaster" })`

2. **LazorKit Portal opens**

   - Browser triggers WebAuthn ceremony
   - User sees biometric prompt and proceeds with it

3. **Passkey created/retrieved**

   - Credential stored in Secure Enclave
   - Syncs via platform (iCloud/Google)

4. **Smart wallet derived**

   - PDA derived from credential
   - Same passkey = same wallet address

5. **Connection complete**
   - `wallet.smartWallet` contains address
   - Ready for transactions

### Security Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Your App   │     │  LazorKit   │     │   Solana    │
    │             │     │   Portal    │     │  Blockchain │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           │                   │                   │
    ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
    │ No secrets  │     │ Coordinates │     │ Smart       │
    │ stored      │     │ signing     │     │ Wallet PDA  │
    └─────────────┘     └─────────────┘     └─────────────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Secure    │
                        │   Enclave   │
                        │             │
                        │ Private key │
                        │ NEVER leaves│
                        └─────────────┘
```

## Next Steps

Now that you have wallet connection working, continue with:

- [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md) - Send SOL without gas fees
- [Tutorial 3: Native SOL Staking](./03-SOL_STAKING.md) - Complex multi-instruction transactions
