# Tutorial 5: Subscription Payments

**Time to complete: 25-30 minutes**

Learn how to implement subscription-based payments with LazorKit. This tutorial covers payment flows, subscription management, and building a gated content system with passkey authentication.

---

## 📚 Table of Contents

1. [Understanding Subscription Payments](#understanding-subscription-payments)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Step 1: Define Subscription Plans](#step-1-define-subscription-plans)
5. [Step 2: Create the Subscription Service](#step-2-create-the-subscription-service)
6. [Step 3: Build the useSubscription Hook](#step-3-build-the-usesubscription-hook)
7. [Step 4: Create the Subscription Page](#step-4-create-the-subscription-page)
8. [Step 5: Build Subscription Gates](#step-5-build-subscription-gates)
9. [Complete Code Example](#complete-code-example)
10. [Production Considerations](#production-considerations)
11. [Testing Your Implementation](#testing-your-implementation)

---

## Understanding Subscription Payments

Subscription payments allow users to pay for access to premium features on a recurring basis. With LazorKit, we can create frictionless subscriptions using passkey authentication.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUBSCRIPTION PAYMENT FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

    User                   Your App               LazorKit              Blockchain
      │                        │                      │                      │
      │  1. Select plan        │                      │                      │
      │───────────────────────>│                      │                      │
      │                        │                      │                      │
      │  2. Passkey prompt     │                      │                      │
      │<───────────────────────│                      │                      │
      │                        │                      │                      │
      │  3. Approve            │                      │                      │
      │───────────────────────>│                      │                      │
      │                        │  4. Sign & send      │                      │
      │                        │─────────────────────>│                      │
      │                        │                      │  5. Transfer SOL     │
      │                        │                      │─────────────────────>│
      │                        │                      │                      │
      │                        │  6. Confirmation     │                      │
      │                        │<─────────────────────│<─────────────────────│
      │  7. Access granted     │                      │                      │
      │<───────────────────────│                      │                      │
      ▼                        ▼                      ▼                      ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Result: User pays SOL, subscription recorded, premium access unlocked       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Use Crypto Subscriptions?

| Benefit             | Description                        |
| ------------------- | ---------------------------------- |
| **No Credit Cards** | Users pay with SOL directly        |
| **Lower Fees**      | Avoid 2-3% payment processor fees  |
| **Global Access**   | Anyone with internet can subscribe |
| **Passkey Auth**    | No passwords, no seed phrases      |
| **Gasless UX**      | Fees covered by your paymaster     |
| **Transparent**     | All payments verifiable on-chain   |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUBSCRIPTION SYSTEM LAYERS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         UI LAYER                                     │   │
│   │   PricingPage.tsx  │  SubscriptionGate.tsx  │  DashboardPage.tsx     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HOOK LAYER                                   │   │
│   │              useSubscription.ts  │  useTransaction.ts                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       SERVICE LAYER                                  │   │
│   │      subscription.ts (localStorage)  │  transfer.ts (SOL transfer)   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       STORAGE LAYER                                  │   │
│   │            localStorage (Demo)  │  Solana Blockchain                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **Note**: This demo uses localStorage for subscription storage. For production, use a database with on-chain verification.

---

## Prerequisites

Before starting:

- ✅ Completed [Tutorial 2: Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- ✅ Have a connected wallet with SOL on Devnet
- ✅ Understand React state management

---

## Step 1: Define Subscription Plans

```typescript
// lib/constants.ts
/**
 * Application Constants
 */

// LazorKit Configuration
export const DEFAULT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

// Subscription Plans (amounts in SOL for demo)
export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    amount: 0.01,
    features: ["Access to basic features", "Email support", "1 project"],
  },
  {
    id: "pro",
    name: "Pro",
    amount: 0.05,
    features: [
      "Everything in Basic",
      "Priority support",
      "10 projects",
      "API access",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    amount: 0.1,
    features: [
      "Everything in Pro",
      "24/7 support",
      "Unlimited projects",
      "Custom integrations",
    ],
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

// Where subscription payments are sent
export const RECIPIENT_WALLET = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";

// Subscription duration
export const SUBSCRIPTION_DURATION_DAYS = 30;
```

_Listing 6-1: Subscription plan definitions and configuration_

This constants file defines the business logic for subscriptions. Let's examine the key decisions:

```typescript
export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    amount: 0.01,
    features: ["Access to basic features", "Email support", "1 project"],
  },
  // ...
] as const;
```

The `as const` assertion makes the array deeply readonly and preserves literal types. This means TypeScript knows that `PLANS[0].id` is literally `"basic"`, not just `string`—enabling better type inference.

```typescript
export type PlanId = (typeof PLANS)[number]["id"];
```

This type extracts all possible plan IDs into a union type: `"basic" | "pro" | "premium"`. If you add a new plan, the type updates automatically—no manual synchronization needed.

```typescript
export const RECIPIENT_WALLET = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";
```

This is where subscription payments are sent. In production, you'd validate this address exists and you control it. For a real business, this might be a treasury multisig or a payment processor's address.

---

## Step 2: Create the Subscription Service

```typescript
// lib/services/subscription.ts
/**
 * Subscription Service
 *
 * Manages subscription data in localStorage.
 * WARNING: For demo purposes only! Use a database in production.
 */

export interface Subscription {
  wallet: string;
  plan: string;
  amount: number;
  signature: string;
  subscribedAt: string;
  expiresAt: string;
}

const STORAGE_KEY = "passpay_subscriptions";
const SUBSCRIPTION_DURATION_DAYS = 30;

/**
 * Save a new subscription
 */
export function saveSubscription(
  wallet: string,
  plan: string,
  amount: number,
  signature: string
): Subscription {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DURATION_DAYS);

  const subscription: Subscription = {
    wallet,
    plan,
    amount,
    signature,
    subscribedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Store indexed by wallet address
  const subscriptions = getAllSubscriptions();
  subscriptions[wallet] = subscription;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }

  return subscription;
}

/**
 * Get subscription for a wallet
 */
export function getSubscription(wallet: string): Subscription | null {
  const subscriptions = getAllSubscriptions();
  return subscriptions[wallet] || null;
}

/**
 * Check if a wallet has an active (non-expired) subscription
 */
export function hasActiveSubscription(wallet: string): boolean {
  const subscription = getSubscription(wallet);

  if (!subscription) return false;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);

  return now < expiresAt;
}

/**
 * Get active subscription (null if none or expired)
 */
export function getActiveSubscription(wallet: string): Subscription | null {
  const subscription = getSubscription(wallet);

  if (!subscription) return null;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);

  return now < expiresAt ? subscription : null;
}

/**
 * Get all subscriptions (internal)
 */
function getAllSubscriptions(): Record<string, Subscription> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Clear subscription for a wallet
 */
export function clearSubscription(wallet: string): void {
  const subscriptions = getAllSubscriptions();
  delete subscriptions[wallet];

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }
}
```

_Listing 6-2: Subscription storage service with localStorage_

This service manages subscription persistence. Let's examine the core patterns:

```typescript
export interface Subscription {
  wallet: string;
  plan: string;
  amount: number;
  signature: string;
  subscribedAt: string;
  expiresAt: string;
}
```

The `Subscription` interface defines our data model. The `signature` field is crucial—it links the subscription to an on-chain transaction for verification.

```typescript
export function saveSubscription(
  wallet: string,
  plan: string,
  amount: number,
  signature: string
): Subscription {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DURATION_DAYS);
```

When saving, we calculate the expiration date by adding 30 days. This creates time-limited access that requires renewal.

```typescript
if (typeof window !== "undefined") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}
```

The `typeof window` check ensures this code works during server-side rendering in Next.js. Without it, the code would crash during build or SSR.

```typescript
export function hasActiveSubscription(wallet: string): boolean {
  const subscription = getSubscription(wallet);
  if (!subscription) return false;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  return now < expiresAt;
}
```

The `hasActiveSubscription` function handles expiration logic—a subscription exists but may have lapsed. This separation (existence vs. validity) enables showing "expired" UI states.

---

## Step 3: Build the useSubscription Hook

```typescript
// hooks/useSubscription.ts
/**
 * useSubscription Hook
 *
 * Handles subscription payments with LazorKit.
 */

import { useCallback } from "react";
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RECIPIENT_WALLET } from "@/lib/constants";
import { saveSubscription } from "@/lib/services/subscription";
import { useTransaction } from "./useTransaction";
import toast from "react-hot-toast";

interface UseSubscriptionReturn {
  subscribe: (amount: number, planName: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export function useSubscription(): UseSubscriptionReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { execute, loading, error } = useTransaction();

  const subscribe = useCallback(
    async (amount: number, planName: string): Promise<string | null> => {
      if (!isConnected || !smartWalletPubkey) {
        toast.error("Please connect your wallet first");
        return null;
      }

      if (amount <= 0) {
        toast.error("Invalid subscription amount");
        return null;
      }

      // Create transfer instruction to recipient
      const destination = new PublicKey(RECIPIENT_WALLET);
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: destination,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      const toastId = toast.loading("Approve with your passkey...");

      try {
        const sig = await execute([instruction]);
        toast.dismiss(toastId);

        if (sig) {
          // Save subscription to local storage
          saveSubscription(smartWalletPubkey.toBase58(), planName, amount, sig);
          toast.success(`${planName} subscription activated! 🎉`);
        }

        return sig;
      } catch {
        toast.dismiss(toastId);
        return null;
      }
    },
    [isConnected, smartWalletPubkey, execute]
  );

  return { subscribe, loading, error };
}
```

_Listing 6-3: Subscription hook connecting payments to storage_

This hook orchestrates the subscription flow. Let's trace the key parts:

```typescript
export function useSubscription(): UseSubscriptionReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { execute, loading, error } = useTransaction();
```

We compose two hooks: `useWallet` for authentication state and `useTransaction` for blockchain operations. This hook adds subscription-specific logic on top.

```typescript
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: destination,
  lamports: Math.floor(amount * LAMPORTS_PER_SOL),
});
```

Subscriptions are just SOL transfers. `Math.floor` ensures we don't send fractional lamports (which would fail). The `LAMPORTS_PER_SOL` constant (1 billion) converts human-readable SOL to the blockchain's native unit.

```typescript
const toastId = toast.loading("Approve with your passkey...");

try {
  const sig = await execute([instruction]);
  toast.dismiss(toastId);

  if (sig) {
    saveSubscription(smartWalletPubkey.toBase58(), planName, amount, sig);
    toast.success(`${planName} subscription activated! 🎉`);
  }
```

The flow is: show loading toast → execute transaction → dismiss loading → save to storage → show success. The `toastId` pattern allows dismissing the specific loading toast.

```typescript
[isConnected, smartWalletPubkey, execute];
```

The dependency array ensures `subscribe` updates when wallet state changes. Missing dependencies cause stale closures—a common React bug.

---

## Step 4: Create the Subscription Page

```typescript
// app/(dashboard)/pricing/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@lazorkit/wallet";
import { useSubscription } from "@/hooks";
import { PLANS, PlanId } from "@/lib/constants";
import {
  getActiveSubscription,
  Subscription,
} from "@/lib/services/subscription";

export default function PricingPage() {
  const router = useRouter();
  const { isConnected, smartWalletPubkey } = useWallet();
  const { subscribe, loading } = useSubscription();

  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  // Check for existing subscription
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const sub = getActiveSubscription(smartWalletPubkey.toBase58());
      setCurrentSubscription(sub);
    }
  }, [isConnected, smartWalletPubkey]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">
            Connect wallet to subscribe
          </p>
          <a href="/login" className="text-[#9945FF] hover:underline">
            Connect Wallet →
          </a>
        </div>
      </div>
    );
  }

  // Already subscribed
  if (currentSubscription) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              ✅ You&apos;re Subscribed!
            </h1>
            <p className="text-gray-400 mb-4">
              Plan:{" "}
              <span className="text-white font-semibold">
                {currentSubscription.plan}
              </span>
            </p>
            <p className="text-gray-400 mb-6">
              Expires:{" "}
              {new Date(currentSubscription.expiresAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-[#9945FF] hover:bg-[#8035E0] text-white rounded-xl"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (planId: PlanId) => {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) return;

    setSelectedPlan(planId);
    const sig = await subscribe(plan.amount, plan.name);

    if (sig) {
      // Refresh subscription state
      const sub = getActiveSubscription(smartWalletPubkey!.toBase58());
      setCurrentSubscription(sub);
      router.push("/dashboard");
    }
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Subscribe with SOL using your passkey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#1a1a1a] rounded-xl p-6 border transition-all ${
                plan.id === "pro"
                  ? "border-[#9945FF] scale-105"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.id === "pro" && (
                <div
                  className="bg-[#9945FF] text-white text-xs font-medium px-3 py-1 
                                rounded-full w-fit mb-4"
                >
                  POPULAR
                </div>
              )}

              <h2 className="text-2xl font-bold text-white mb-2">
                {plan.name}
              </h2>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.amount}
                </span>
                <span className="text-gray-400 ml-2">SOL/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                  plan.id === "pro"
                    ? "bg-[#9945FF] hover:bg-[#8035E0] text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                } disabled:opacity-50`}
              >
                {loading && selectedPlan === plan.id
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔒 Secured by passkeys · ⛽ Zero gas fees · 💳 Instant activation
          </p>
        </div>
      </div>
    </div>
  );
}
```

_Listing 6-4: Complete pricing page with subscription handling_

This page handles all subscription states. Let's examine the state machine:

```typescript
const [currentSubscription, setCurrentSubscription] =
  useState<Subscription | null>(null);
const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

useEffect(() => {
  if (isConnected && smartWalletPubkey) {
    const sub = getActiveSubscription(smartWalletPubkey.toBase58());
    setCurrentSubscription(sub);
  }
}, [isConnected, smartWalletPubkey]);
```

On mount, we check for an existing subscription. The `useEffect` dependency on wallet state ensures we recheck if the user disconnects and reconnects.

```typescript
if (!isConnected) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      {/* Redirect to login */}
    </div>
  );
}

if (currentSubscription) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      {/* Show subscription status */}
    </div>
  );
}
```

This pattern shows different UI based on state: not connected → show login prompt, already subscribed → show status, otherwise → show pricing cards. React renders the first matched condition.

```typescript
const handleSubscribe = async (planId: PlanId) => {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return;

  setSelectedPlan(planId);
  const sig = await subscribe(plan.amount, plan.name);

  if (sig) {
    const sub = getActiveSubscription(smartWalletPubkey!.toBase58());
    setCurrentSubscription(sub);
    router.push("/dashboard");
  }
  setSelectedPlan(null);
};
```

The `setSelectedPlan` tracks which button shows the loading state. After success, we refresh subscription state and navigate away. The `null` assignment at the end resets loading state for error cases.

---

## Step 5: Build Subscription Gates

### SubscriptionGate Component

```typescript
// components/SubscriptionGate.tsx
"use client";
import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@lazorkit/wallet";
import { hasActiveSubscription } from "@/lib/services/subscription";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionGate({ children, fallback }: Props) {
  const router = useRouter();
  const { isConnected, smartWalletPubkey, loading } = useWallet();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!isConnected || !smartWalletPubkey) {
      router.push("/login");
      return;
    }

    const hasSubscription = hasActiveSubscription(smartWalletPubkey.toBase58());
    setIsSubscribed(hasSubscription);
    setChecking(false);

    if (!hasSubscription) {
      router.push("/pricing");
    }
  }, [isConnected, smartWalletPubkey, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9945FF]" />
      </div>
    );
  }

  if (!isSubscribed) {
    return fallback || null;
  }

  return <>{children}</>;
}
```

_Listing 6-5: Subscription gate component for protected content_

The `SubscriptionGate` component protects premium content. Let's analyze its protection logic:

```typescript
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
```

The component takes `children` (protected content) and optional `fallback` (what to show unauthorized users). This pattern makes the gate reusable across different pages.

```typescript
const [isSubscribed, setIsSubscribed] = useState(false);
const [checking, setChecking] = useState(true);
```

Two loading states: `checking` indicates initial verification, `isSubscribed` is the final verdict. Starting `checking` as `true` prevents flash of unauthorized content.

```typescript
useEffect(() => {
  if (loading) return;

  if (!isConnected || !smartWalletPubkey) {
    router.push("/login");
    return;
  }

  const hasSubscription = hasActiveSubscription(smartWalletPubkey.toBase58());
  setIsSubscribed(hasSubscription);
  setChecking(false);

  if (!hasSubscription) {
    router.push("/pricing");
  }
}, [isConnected, smartWalletPubkey, loading, router]);
```

The guard logic flows: wait for wallet loading → check connection → verify subscription → redirect if needed. The `router.push` calls create automatic redirects to appropriate pages.

```typescript
if (loading || checking) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9945FF]" />
    </div>
  );
}
```

During verification, show a spinner. This prevents content flash and provides feedback that something is happening.

### Using the Gate

```typescript
// app/(dashboard)/premium/page.tsx
"use client";
import { SubscriptionGate } from "@/components/SubscriptionGate";

export default function PremiumPage() {
  return (
    <SubscriptionGate>
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">
            🌟 Premium Content
          </h1>
          <p className="text-gray-400 mb-8">
            Welcome to the exclusive premium area!
          </p>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-4">
              Your Premium Features
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>• Advanced analytics dashboard</li>
              <li>• Priority API access</li>
              <li>• Custom integrations</li>
              <li>• Premium support</li>
            </ul>
          </div>
        </div>
      </div>
    </SubscriptionGate>
  );
}
```

_Listing 6-6: Protected premium page using subscription gate_

Using the gate is straightforward—wrap any content that requires subscription:

```typescript
export default function PremiumPage() {
  return <SubscriptionGate>{/* Premium content here */}</SubscriptionGate>;
}
```

The `SubscriptionGate` handles all authentication and subscription verification. Your page component only needs to define what premium content to show—separation of concerns in action.

---

## Complete Code Example

Here's a minimal, self-contained subscription button:

```typescript
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState } from "react";

const RECIPIENT = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";

export function QuickSubscribe() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isConnected || !smartWalletPubkey) return;

    setLoading(true);
    try {
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey(RECIPIENT),
        lamports: 0.05 * LAMPORTS_PER_SOL, // 0.05 SOL
      });

      const signature = await signAndSendTransaction([instruction]);
      console.log("Subscription tx:", signature);

      // Save subscription status
      localStorage.setItem("subscribed", "true");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSubscribe} disabled={loading}>
      {loading ? "Processing..." : "Subscribe for 0.05 SOL"}
    </button>
  );
}
```

_Listing 6-7: Minimal subscription button for quick integration_

This stripped-down example shows the core subscription logic without extra abstraction:

```typescript
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: new PublicKey(RECIPIENT),
  lamports: 0.05 * LAMPORTS_PER_SOL,
});

const signature = await signAndSendTransaction([instruction]);
```

Just two steps: create a transfer instruction, then sign and send. The `signAndSendTransaction` function triggers the passkey prompt. If you need subscriptions quickly, this pattern works—add the hooks and storage layer later as complexity grows.

---

## Production Considerations

### Security Improvements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION SUBSCRIPTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │   Client    │───>│  Your API   │───>│  Database   │    │  Blockchain │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                   │                  │                  │          │
│         │                   │                  │                  │          │
│   1. User pays              │                  │                  │          │
│      with passkey ──────────┼──────────────────┼─────────────────>│          │
│         │                   │                  │                  │          │
│   2. Get signature ─────────┼──────────────────┼─────────────────>│          │
│         │                   │                  │                  │          │
│   3. Send signature ───────>│                  │                  │          │
│         │                   │                  │                  │          │
│   4. Verify on-chain ───────┼──────────────────┼─────────────────>│          │
│         │                   │                  │                  │          │
│   5. Store subscription ────┼─────────────────>│                  │          │
│         │                   │                  │                  │          │
│   6. Return success <───────┼──────────────────┼──────────────────│          │
│         │                   │                  │                  │          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Verification (Recommended)

```typescript
// Example: Verify subscription server-side
async function verifySubscription(signature: string, expectedAmount: number) {
  const connection = new Connection("https://api.devnet.solana.com");
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) throw new Error("Transaction not found");
  if (tx.meta?.err) throw new Error("Transaction failed");

  // Verify amount and recipient
  // Store in database with wallet address
  // Return subscription token/JWT
}
```

### Database Schema (Example)

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  amount DECIMAL(18, 9) NOT NULL,
  signature VARCHAR(88) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet ON subscriptions(wallet_address);
CREATE INDEX idx_expires ON subscriptions(expires_at);
```

---

## Testing Your Implementation

### Unit Tests

```typescript
// tests/services/subscription.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveSubscription,
  getSubscription,
  hasActiveSubscription,
  clearSubscription,
} from "@/lib/services/subscription";

describe("Subscription Service", () => {
  const testWallet = "TestWallet123";

  beforeEach(() => {
    localStorage.clear();
  });

  describe("saveSubscription", () => {
    it("saves and returns subscription", () => {
      const sub = saveSubscription(testWallet, "Pro", 0.05, "sig123");

      expect(sub.wallet).toBe(testWallet);
      expect(sub.plan).toBe("Pro");
      expect(sub.amount).toBe(0.05);
      expect(sub.signature).toBe("sig123");
    });
  });

  describe("getSubscription", () => {
    it("returns subscription for wallet", () => {
      saveSubscription(testWallet, "Basic", 0.01, "sig1");

      const sub = getSubscription(testWallet);
      expect(sub?.plan).toBe("Basic");
    });

    it("returns null for unknown wallet", () => {
      const sub = getSubscription("unknown");
      expect(sub).toBeNull();
    });
  });

  describe("hasActiveSubscription", () => {
    it("returns true for active subscription", () => {
      saveSubscription(testWallet, "Pro", 0.05, "sig2");
      expect(hasActiveSubscription(testWallet)).toBe(true);
    });

    it("returns false for no subscription", () => {
      expect(hasActiveSubscription("noWallet")).toBe(false);
    });
  });

  describe("clearSubscription", () => {
    it("removes subscription", () => {
      saveSubscription(testWallet, "Pro", 0.05, "sig3");
      clearSubscription(testWallet);

      expect(getSubscription(testWallet)).toBeNull();
    });
  });
});
```

### Manual Testing

1. **Visit pricing page** - `/pricing`
2. **Select a plan** - Click "Subscribe"
3. **Approve with passkey** - Biometric prompt
4. **Verify redirect** - Should go to dashboard
5. **Check subscription** - Try accessing gated content
6. **Verify on-chain** - Check Solscan for the transfer

---

## Next Steps

Congratulations! You've learned how to build a complete subscription system.

Explore more:

- [API Reference](../API_REFERENCE.md) - Full hook documentation
- [Testing Guide](../TESTING.md) - Comprehensive testing strategies
- [Deployment Guide](../DEPLOYMENT.md) - Deploy to production
