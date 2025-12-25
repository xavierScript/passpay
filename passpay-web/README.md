# 🚀 Lazorkit Subscription Starter

> Build Netflix-style subscriptions on Solana with passkey authentication in 30 minutes.

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://passpay-demo.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com)

A production-ready starter template demonstrating Solana subscription services using **Lazorkit SDK** for passkey authentication, smart wallets, and gasless USDC payments.

## ✨ Features

✅ **Passkey Authentication** - No seed phrases, just biometric login (FaceID/TouchID/Windows Hello)  
✅ **Fallback Auth** - Device PIN support for non-biometric devices  
✅ **Gasless USDC Billing** - Paymaster-sponsored recurring subscriptions  
✅ **Smart Wallet Auto-Approvals** - Set-and-forget recurring payments  
✅ **"Pay with Solana" Widget** - Reusable payment component for one-time purchases  
✅ **Production-Ready TypeScript** - Strict types, error handling, and edge cases covered  
✅ **Mobile Responsive UI** - Built with Tailwind CSS and custom components

## 🎯 Use Cases

- **SaaS Subscriptions** - Monthly/yearly billing in USDC
- **Creator Platforms** - Recurring support for content creators
- **Premium Content Gating** - Netflix-style subscription access
- **NFT Memberships** - Token-gated communities with auto-renewal

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
│  (Passkey)  │
└──────┬──────┘
       │ WebAuthn
       ▼
┌─────────────────┐      ┌──────────────┐
│ Lazorkit Portal │◄────►│ Smart Wallet │
│   (Auth Flow)   │      │     (PDA)    │
└─────────────────┘      └──────┬───────┘
                                │
                                │ Delegate
                                ▼
                         ┌──────────────┐
                         │  Paymaster   │◄─── Gasless Txs
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │ Solana Devnet│
                         └──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Git** for version control
- **Modern Browser** with WebAuthn support (Chrome 108+, Safari 16+, Firefox 119+)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_API_KEY=your_lazorkit_api_key
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
CRON_SECRET=your_random_secret_for_cron_jobs
```

**Get Your API Key:**  
Visit [Lazorkit Dashboard](https://portal.lazor.sh) to create a free account and generate your API key.

## 📚 Project Structure

```
passpay/
├── app/
│   ├── (auth)/
│   │   └── login/              # Passkey authentication
│   ├── (dashboard)/
│   │   ├── subscribe/          # Subscription plans
│   │   ├── manage/             # Dashboard & billing
│   │   └── premium/            # Gated content
│   ├── api/
│   │   ├── subscription/       # Subscription endpoints
│   │   └── wallet/             # Balance queries
│   └── layout.tsx              # Root layout with providers
├── components/
│   ├── PasskeySetup.tsx        # Passkey flow component
│   ├── PayWithSolana.tsx       # Payment widget
│   ├── SubscriptionCard.tsx    # Pricing card
│   └── ui/                     # Reusable UI primitives
├── lib/
│   ├── lazorkit.ts             # Lazorkit SDK wrapper
│   ├── constants.ts            # Config & plans
│   └── utils.ts                # Helpers (crypto, retry)
├── types/
│   └── index.ts                # TypeScript interfaces
└── docs/                       # Tutorials
```

## 🎓 Tutorials

1. [Setting up Passkey Wallets](./docs/01-passkey-wallet.md)
2. [Implementing Subscriptions](./docs/02-subscription-flow.md)
3. [Production Deployment](./docs/03-production.md)

## 🔧 Key Components

### Passkey Authentication

```tsx
import { useWallet } from "@lazorkit/wallet";

function Login() {
  const { connect, wallet } = useWallet();

  const handleLogin = async () => {
    await connect({ feeMode: "paymaster" });
    console.log("Wallet:", wallet.smartWallet);
  };
}
```

### Subscription Flow

```tsx
// Create subscription with smart wallet delegation
const subscription = await fetch("/api/subscription/create", {
  method: "POST",
  body: JSON.stringify({ planId: "pro", walletAddress }),
});
```

### Gasless USDC Transfer

```tsx
import { LazorkitManager } from "@/lib/lazorkit";

const lazorkit = new LazorkitManager({
  signAndSendTransaction,
  smartWalletPubkey,
});
const signature = await lazorkit.transferUSDC(10, recipientAddress);
```

## 🧪 Testing

### Local Testing

1. **Start Dev Server:**

   ```bash
   npm run dev
   ```

2. **Test Passkey Flow:**

   - Navigate to `/login`
   - Click "Login with Biometrics"
   - Approve passkey creation (FaceID/TouchID)

3. **Fund Test Wallet:**

   - Copy your wallet address from the UI
   - Visit [Solana Devnet Faucet](https://faucet.solana.com)
   - Get devnet USDC from [SPL Token Faucet](https://spl-token-faucet.com/)

4. **Test Subscription:**
   - Navigate to `/subscribe`
   - Select a plan and confirm
   - Check transaction on [Solscan Devnet](https://solscan.io/?cluster=devnet)

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Deploy:**

   ```bash
   vercel --prod
   ```

2. **Set Environment Variables:**

   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.local`

3. **Setup Cron Job:**
   - Create `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/subscription/charge",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

### Production Checklist

- [ ] Set `NEXT_PUBLIC_SOLANA_RPC_URL` to mainnet RPC (Helius/QuickNode)
- [ ] Update `NEXT_PUBLIC_USDC_MINT` to mainnet USDC address
- [ ] Generate strong `CRON_SECRET` for charge endpoint
- [ ] Add database for subscription persistence (Supabase/Postgres)
- [ ] Setup Sentry/LogRocket for error tracking

## 📖 API Reference

### Subscription Endpoints

#### `POST /api/subscription/create`

Create a new subscription.

**Request:**

```json
{
  "planId": "pro",
  "walletAddress": "5Qz..."
}
```

**Response:**

```json
{
  "ok": true,
  "data": {
    "walletAddress": "5Qz...",
    "tier": "pro",
    "status": "active"
  }
}
```

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Lazorkit** - For the amazing passkey SDK
- **Solana Foundation** - For the robust blockchain infrastructure
- **Vercel** - For seamless deployment

---

**Built with ❤️ using Lazorkit, Solana, and Next.js**
