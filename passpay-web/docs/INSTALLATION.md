# 🔧 Installation & Setup Guide

A comprehensive guide to setting up LazorKit SDK in a Next.js project from scratch.

---

## Table of Contents

1. [Create New Next.js Project](#1-create-new-nextjs-project)
2. [Install Dependencies](#2-install-dependencies)
3. [Configure Polyfills](#3-configure-polyfills)
4. [Setup LazorKit Provider](#4-setup-lazorkit-provider)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Setup Tailwind CSS (Optional)](#6-setup-tailwind-css-optional)
7. [Verify Installation](#7-verify-installation)

---

## 1. Create New Next.js Project

If you're starting fresh, create a new Next.js project with TypeScript:

```bash
# Create new Next.js project with App Router
npx create-next-app@latest my-lazorkit-app --typescript --tailwind --app --eslint

cd my-lazorkit-app
```

---

## 2. Install Dependencies

### Core Dependencies

```bash
# LazorKit SDK for Web
npm install @lazorkit/wallet

# Solana Web3.js
npm install @solana/web3.js

# Buffer polyfill for browser
npm install buffer

# Toast notifications (optional but recommended)
npm install react-hot-toast
```

### Complete package.json dependencies

Your `package.json` should include these key dependencies:

```json
{
  "dependencies": {
    "@lazorkit/wallet": "^1.0.0",
    "@solana/web3.js": "^1.98.0",
    "buffer": "^6.0.3",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 3. Configure Polyfills

### Why Polyfills?

Some Solana libraries expect Node.js globals like `Buffer` that don't exist in browsers. We need to polyfill these for browser compatibility.

### Setup Buffer Polyfill

In your providers file, add the Buffer polyfill:

```typescript
// app/providers.tsx
"use client";
import { useEffect } from "react";
import { Buffer } from "buffer";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Buffer polyfill for SDKs expecting Node globals
    if (typeof window !== "undefined" && !window.Buffer) {
      window.Buffer = Buffer;
    }
  }, []);

  return <>{children}</>;
}
```

### Add TypeScript Declaration

Create a type declaration for the global Buffer:

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

## 4. Setup LazorKit Provider

### Create the Provider Component

```typescript
// app/providers.tsx
"use client";
import React, { useEffect } from "react";
import { LazorkitProvider } from "@lazorkit/wallet";
import { Toaster } from "react-hot-toast";
import { Buffer } from "buffer";

// LazorKit configuration
const LAZORKIT_CONFIG = {
  rpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  portalUrl:
    process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl:
      process.env.NEXT_PUBLIC_PAYMASTER_URL ||
      "https://kora.devnet.lazorkit.com",
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Buffer polyfill for SDKs expecting Node globals
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

### Update Root Layout

```typescript
// app/layout.tsx
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata = {
  title: "PassPay - Solana Payments",
  description: "Passwordless Solana payments with passkeys",
};

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

---

## 5. Configure Environment Variables

### Create Environment Files

```bash
# .env.local (development)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

### Environment Variable Reference

| Variable                          | Description                    | Default                            |
| --------------------------------- | ------------------------------ | ---------------------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`      | Solana RPC endpoint            | `https://api.devnet.solana.com`    |
| `NEXT_PUBLIC_LAZORKIT_PORTAL_URL` | LazorKit authentication portal | `https://portal.lazor.sh`          |
| `NEXT_PUBLIC_PAYMASTER_URL`       | Paymaster for gasless txs      | `https://kora.devnet.lazorkit.com` |

---

## 6. Setup Tailwind CSS (Optional)

If you didn't use the `--tailwind` flag when creating your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configure Tailwind

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        solana: {
          green: "#14F195",
          purple: "#9945FF",
        },
      },
    },
  },
  plugins: [],
};
```

### Add Tailwind Directives

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for dark theme */
body {
  @apply bg-[#0a0a0a] text-white min-h-screen;
}
```

---

## 7. Verify Installation

### Create a Test Component

```typescript
// app/page.tsx
"use client";
import { useWallet } from "@lazorkit/wallet";

export default function Home() {
  const { connect, isConnected, wallet, isConnecting } = useWallet();

  const handleConnect = async () => {
    try {
      await connect({ feeMode: "paymaster" });
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">PassPay Web</h1>

      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-6 py-3 bg-[#9945FF] rounded-lg hover:bg-[#8035E0] disabled:opacity-50"
        >
          {isConnecting ? "Connecting..." : "Connect with Passkey"}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-[#14F195] font-semibold">✓ Connected!</p>
          <p className="text-sm text-gray-400 mt-2 font-mono">
            {wallet?.smartWallet}
          </p>
        </div>
      )}
    </main>
  );
}
```

### Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and click "Connect with Passkey". If the passkey modal appears, your installation is successful!

---

## Common Setup Issues

### ❌ "Buffer is not defined"

**Solution:** Ensure the Buffer polyfill loads before any Solana code:

```typescript
useEffect(() => {
  if (typeof window !== "undefined" && !window.Buffer) {
    window.Buffer = Buffer;
  }
}, []);
```

### ❌ "WebAuthn not supported"

**Solution:** Ensure you're using HTTPS or localhost. WebAuthn doesn't work on plain HTTP.

### ❌ "Module not found: @lazorkit/wallet"

**Solution:** Install the correct package:

```bash
npm install @lazorkit/wallet
```

---

## Next Steps

Now that you have LazorKit installed, continue with:

1. [Tutorial 1: Passkey Wallet](./tutorials/01-PASSKEY_WALLET.md) - Deep dive into authentication
2. [Tutorial 2: Gasless Transactions](./tutorials/02-GASLESS_TRANSACTIONS.md) - Send your first transaction
