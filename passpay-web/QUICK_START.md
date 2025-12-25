# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

The `.env.local` file already has demo values for local testing. You can start immediately!

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test the App

#### Step 1: Visit the Landing Page

- You'll see a clean landing page with feature highlights
- Click "Get Started" to proceed to login

#### Step 2: Login with Passkey

- Navigate to `/login`
- Click "Login with Biometrics"
- Your browser will prompt for passkey creation (FaceID/TouchID/Windows Hello)
- After successful authentication, you'll be redirected to `/subscribe`

#### Step 3: View Subscription Plans

- You'll see three tiers: Basic ($5), Pro ($10), Enterprise ($20)
- Click "Subscribe" on any plan
- Note: This is a demo, so no actual USDC transfer happens without funding

#### Step 4: View Dashboard

- Navigate to `/manage`
- See your active subscription status
- View payment history (mock data)
- Try canceling the subscription

#### Step 5: Test Premium Content

- Navigate to `/premium`
- This page would normally be gated by subscription status
- Currently accessible for demo purposes

### 5. Testing with Real USDC (Optional)

To test actual transactions on Solana Devnet:

1. **Get Lazorkit API Key:**

   - Visit [https://portal.lazor.sh](https://portal.lazor.sh)
   - Sign up and generate an API key
   - Update `NEXT_PUBLIC_LAZORKIT_API_KEY` in `.env.local`

2. **Fund Your Wallet:**

   - After logging in, copy your wallet address from the UI
   - Get SOL: [https://faucet.solana.com](https://faucet.solana.com)
   - Get USDC: [https://spl-token-faucet.com](https://spl-token-faucet.com)
   - Paste your wallet address and request tokens

3. **Test Payment:**
   - Go to `/subscribe` and select a plan
   - The transaction will execute using Lazorkit's gasless paymaster
   - Check transaction on [Solscan Devnet](https://solscan.io/?cluster=devnet)

## 🏗️ Project Structure Overview

```
passpay/
├── app/                    # Next.js 14 App Router pages
│   ├── (auth)/login        # Passkey authentication
│   ├── (dashboard)/        # Subscription management
│   └── api/                # Backend API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions & SDK wrappers
├── docs/                   # Step-by-step tutorials
└── types/                  # TypeScript interfaces
```

## 🎯 Key Features to Explore

### 1. Passkey Authentication

File: [components/PasskeySetup.tsx](components/PasskeySetup.tsx)

- No seed phrases needed
- Biometric login (FaceID/TouchID)
- Fallback for non-biometric devices

### 2. Smart Wallet Integration

File: [lib/lazorkit.ts](lib/lazorkit.ts)

- Lazorkit SDK wrapper class
- Gasless USDC transfers
- Smart wallet delegation

### 3. Subscription Management

File: [app/api/subscription/create/route.ts](app/api/subscription/create/route.ts)

- Create/cancel subscriptions
- Monthly billing automation (cron)
- Payment history tracking

### 4. Reusable Payment Widget

File: [components/PayWithSolana.tsx](components/PayWithSolana.tsx)

- One-click USDC payments
- Balance checking
- Transaction status display

## 📚 Next Steps

1. **Read Tutorials:**

   - [Setting up Passkey Wallets](docs/01-passkey-wallet.md)
   - [Implementing Subscriptions](docs/02-subscription-flow.md)
   - [Production Deployment](docs/03-production.md)

2. **Customize:**

   - Update subscription tiers in [lib/constants.ts](lib/constants.ts)
   - Modify UI colors in [components/ui/](components/ui/)
   - Add your branding to [app/page.tsx](app/page.tsx)

3. **Deploy:**
   - Follow [docs/03-production.md](docs/03-production.md)
   - Deploy to Vercel with one command: `vercel --prod`

## 🆘 Troubleshooting

### "Wallet not connected" error

**Solution:** Ensure you're on a supported browser (Chrome 108+, Safari 16+, Firefox 119+)

### Passkey prompt doesn't appear

**Solution:** Check browser permissions or try incognito mode

### Build errors

**Solution:** Delete `.next` folder and rebuild:

```bash
rm -rf .next
npm run build
```

### Environment variable errors

**Solution:** Verify all required variables are in `.env.local`:

```bash
cat .env.local
```

## 💡 Tips

- **Development:** Use `npm run dev` for hot reload
- **Production Build:** Test with `npm run build && npm start`
- **Linting:** Run `npm run lint` to check code quality
- **Browser DevTools:** Open Network tab to see API calls

## 🎉 You're Ready!

Your Lazorkit subscription service is now running locally. Start exploring the code and customizing it for your use case!

For detailed implementation guides, see the [docs/](docs/) folder.
