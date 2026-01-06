# 🚀 Quick Start Guide

Get PassPay Web running on your machine in under 5 minutes.

---

## Prerequisites

- **Node.js** 18 or higher ([download](https://nodejs.org/))
- **Git** for cloning the repository
- **Modern Browser** with WebAuthn support (Chrome 108+, Safari 16+, Firefox 119+)

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/passpay-web.git

# Navigate to project directory
cd passpay-web

# Install dependencies
npm install
```

---

## Step 2: Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

---

## Step 3: Start Development Server

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 4: Test the App

1. **Visit the app** - You'll see the PassPay welcome page
2. **Click "Login with Passkey"** - Opens the authentication modal
3. **Authenticate with biometrics** - FaceID, TouchID, or Windows Hello
4. **You're connected!** - See your wallet address and balance

---

## 🎉 What's Next?

Now that you have the app running, dive into the tutorials:

| Tutorial                                                       | What You'll Learn                      |
| -------------------------------------------------------------- | -------------------------------------- |
| [Passkey Wallet](./tutorials/01-PASSKEY_WALLET.md)             | How passkey authentication works       |
| [Gasless Transactions](./tutorials/02-GASLESS_TRANSACTIONS.md) | Send SOL without gas fees              |
| [SOL Staking](./tutorials/03-SOL_STAKING.md)                   | Complex multi-instruction transactions |
| [On-Chain Memos](./tutorials/04-ON_CHAIN_MEMOS.md)             | Store permanent messages on Solana     |
| [Subscriptions](./tutorials/05-SUBSCRIPTION_PAYMENTS.md)       | Build recurring payment flows          |
| [Session Management](./tutorials/06-SESSION_MANAGEMENT.md)     | Persist sessions with localStorage     |

---

## 🐛 Having Issues?

Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common problems and solutions.

---

## 📁 Project Structure Overview

```
passpay-web/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with providers
│   ├── providers.tsx         # LazorKit Provider setup
│   ├── page.tsx              # Home page
│   ├── (auth)/               # Authentication routes
│   │   └── login/            # Passkey login page
│   └── (dashboard)/          # Protected routes
│       ├── transfer/         # Gasless SOL transfers
│       ├── memo/             # On-chain memos
│       ├── staking/          # SOL staking
│       ├── subscribe/        # Subscription plans
│       ├── manage/           # Dashboard & billing
│       └── premium/          # Gated content
├── components/               # Reusable UI components
│   ├── PasskeySetup.tsx      # Passkey connection flow
│   ├── WalletConnect.tsx     # Wallet connection UI
│   └── ui/                   # Shadcn UI primitives
├── hooks/                    # Custom React hooks
│   ├── useTransaction.ts     # Transaction execution
│   ├── useTransfer.ts        # SOL transfers
│   ├── useSolBalance.ts      # Balance fetching
│   ├── useStaking.ts         # Staking operations
│   ├── useMemo.ts            # Memo writing
│   └── useSubscription.ts    # Subscription payments
├── lib/                      # Utilities and services
│   ├── constants.ts          # Configuration
│   ├── utils.ts              # Helper functions
│   └── services/             # Solana service functions
└── tests/                    # Test files
```

---

## ⚙️ Configuration

The app is pre-configured for Solana **Devnet**. Configuration is in `lib/constants.ts`:

```typescript
export const DEFAULT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

For mainnet deployment, see the [Deployment Guide](./DEPLOYMENT.md).

---

## 🔒 Browser Compatibility

PassPay Web uses WebAuthn for passkey authentication. Supported browsers:

| Browser | Minimum Version | Platform            |
| ------- | --------------- | ------------------- |
| Chrome  | 108+            | Windows, Mac, Linux |
| Safari  | 16+             | Mac, iOS            |
| Firefox | 119+            | Windows, Mac, Linux |
| Edge    | 108+            | Windows, Mac        |

> ⚠️ **HTTPS Required**: WebAuthn only works over HTTPS (or localhost for development).
