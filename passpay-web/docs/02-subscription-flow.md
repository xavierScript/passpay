# Implementing Subscription Flow

This tutorial covers the end-to-end subscription implementation with Lazorkit smart wallets.

## Overview

Subscriptions require:

1. Smart wallet delegation for recurring payments
2. USDC balance verification
3. Gasless transaction execution
4. Subscription metadata storage
5. Monthly billing automation

## Step 1: Define Subscription Plans

Create plan configuration:

```tsx
// lib/constants.ts
export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    amount: 5,
    description: "Access to basic content",
  },
  {
    id: "pro",
    name: "Pro",
    amount: 10,
    description: "Premium content + features",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 20,
    description: "All content + priority support",
  },
] as const;
```

## Step 2: Create Subscription Page

Build the pricing UI:

```tsx
// app/(dashboard)/subscribe/page.tsx
"use client";
import { useWallet } from "@lazorkit/wallet";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { PLANS } from "@/lib/constants";

export default function SubscribePage() {
  const { smartWalletPubkey } = useWallet();

  async function handleSubscribe(planId: string) {
    const res = await fetch("/api/subscription/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        walletAddress: smartWalletPubkey.toBase58(),
      }),
    });

    const data = await res.json();
    if (data.ok) {
      router.push("/manage");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <SubscriptionCard
          key={plan.id}
          title={plan.name}
          price={plan.amount}
          onSubscribe={() => handleSubscribe(plan.id)}
        />
      ))}
    </div>
  );
}
```

## Step 3: Implement Subscription API

Create the subscription endpoint:

```tsx
// app/api/subscription/create/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { planId, walletAddress } = await req.json();

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "Invalid plan" },
      { status: 400 }
    );
  }

  // Create subscription record
  const subscription = {
    walletAddress,
    tier: plan.id,
    startDate: new Date().toISOString(),
    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
  };

  // TODO: Store in database
  // await db.subscriptions.insert(subscription);

  // TODO: Set up smart wallet delegation
  // await setupRecurringPayment(walletAddress, plan.amount);

  return NextResponse.json({ ok: true, data: subscription });
}
```

## Step 4: Smart Wallet Delegation

Approve recurring payments via Lazorkit:

```tsx
// lib/lazorkit.ts
export class LazorkitManager {
  async approveRecurringPayment(
    amount: number,
    intervalSeconds: number,
    recipient: string
  ): Promise<{ approvalId: string }> {
    // This would call Lazorkit's on-chain program to set up delegation
    // For demo, we return a mock approval ID
    const approvalId = `appr_${amount}_${intervalSeconds}_${recipient}`;

    // In production:
    // const tx = await this.program.methods
    //   .approveDelegation(new BN(amount), new BN(intervalSeconds))
    //   .accounts({ authority: this.smartWalletPubkey, recipient })
    //   .rpc();

    return { approvalId };
  }
}
```

## Step 5: Execute Gasless USDC Transfer

Charge subscriptions using paymaster:

```tsx
// lib/lazorkit.ts
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from "@solana/spl-token";

export class LazorkitManager {
  async transferUSDC(amount: number, recipient: string): Promise<string> {
    const mint = new PublicKey(USDC_MINT);
    const fromAta = await getAssociatedTokenAddress(
      mint,
      this.smartWalletPubkey
    );
    const toAta = await getAssociatedTokenAddress(
      mint,
      new PublicKey(recipient)
    );

    const instruction = createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      this.smartWalletPubkey,
      amount * 10 ** 6, // USDC decimals
      6
    );

    // Gasless execution via paymaster
    const signature = await this.signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: {
        feeToken: "USDC",
        computeUnitLimit: 500_000,
      },
    });

    return signature;
  }
}
```

## Step 6: Monthly Billing Automation

Create a cron endpoint for recurring charges:

```tsx
// app/api/subscription/charge/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Query all active subscriptions
  // const subscriptions = await db.subscriptions.findMany({
  //   where: { status: "active", nextBilling: { lte: new Date() } }
  // });

  // For each subscription:
  // 1. Check if nextBilling is due
  // 2. Charge via delegated smart wallet
  // 3. Update nextBilling date
  // 4. Handle failures (set to 'grace' status)

  return NextResponse.json({ ok: true, data: { charged: 0 } });
}
```

## Step 7: Setup Vercel Cron

Configure automated billing:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/subscription/charge",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## Step 8: Subscription Status Check

Query subscription status:

```tsx
// app/api/subscription/status/route.ts
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  // Query database
  // const subscription = await db.subscriptions.findUnique({
  //   where: { walletAddress: wallet }
  // });

  return NextResponse.json({ ok: true, data: subscription });
}
```

## Error Handling

### Insufficient Balance

```tsx
async function handleSubscribe(planId: string) {
  // Check balance before subscription
  const balanceRes = await fetch(`/api/wallet/balance?wallet=${walletAddress}`);
  const { balance } = await balanceRes.json();

  const plan = PLANS.find((p) => p.id === planId);
  if (balance < plan.amount) {
    toast.error("Insufficient USDC. Please add funds.");
    return;
  }

  // Proceed with subscription
}
```

### Delegation Revoked

```tsx
async function chargeSubscription(subscription) {
  try {
    await lazorkit.transferUSDC(subscription.amount, RECIPIENT);
  } catch (error) {
    if (error.message.includes("delegation")) {
      // Update status to cancelled
      await db.subscriptions.update({
        where: { id: subscription.id },
        data: { status: "cancelled" },
      });

      // Notify user
      await sendEmail(subscription.walletAddress, "Subscription cancelled");
    }
  }
}
```

## Best Practices

1. **Grace Periods:** Give users 3 days to resolve payment failures
2. **Email Notifications:** Alert users before charging
3. **Transaction Logging:** Store all payment signatures for auditing
4. **Retry Logic:** Retry failed charges with exponential backoff
5. **Database Indexes:** Index `nextBilling` column for efficient queries

## Next Steps

- [Production Deployment](./03-production.md)
