# 🚀 Quick Start Guide

Get PassPay running on your device in under 5 minutes.

---

## Prerequisites

- **Node.js** 18 or higher ([download](https://nodejs.org/))
- **Git** for cloning the repository
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/passpay-mobile.git

# Navigate to project directory
cd passpay-mobile

# Install dependencies (use legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps
```

---

## Step 2: Start Development Server

```bash
# Start Expo development server
npx expo start
```

You'll see a QR code in your terminal.

---

## Step 3: Run on Your Device

### Option A: Physical Device (Recommended)

1. Open **Expo Go** app on your phone
2. Scan the QR code from the terminal
3. Wait for the app to load

### Option B: iOS Simulator (Mac only)

```bash
npm run ios
```

### Option C: Android Emulator

```bash
npm run android
```

---

## Step 4: Test the App

1. **Launch the app** - You'll see the PassPay welcome screen
2. **Tap "Get Started"** - Navigate to the wallet tab
3. **Tap "Connect with Passkey"** - Opens LazorKit portal
4. **Authenticate with biometrics** - FaceID, TouchID, or Fingerprint
5. **You're connected!** - See your wallet address and balance

---

## 🎉 What's Next?

Now that you have the app running, dive into the tutorials:

| Tutorial                                                       | What You'll Learn                      |
| -------------------------------------------------------------- | -------------------------------------- |
| [Passkey Wallet](./tutorials/01-PASSKEY_WALLET.md)             | How passkey authentication works       |
| [Gasless Transactions](./tutorials/02-GASLESS_TRANSACTIONS.md) | Send SOL without gas fees              |
| [SOL Staking](./tutorials/03-SOL_STAKING.md)                   | Complex multi-instruction transactions |
| [On-Chain Memos](./tutorials/04-ON_CHAIN_MEMOS.md)             | Store permanent messages on Solana     |
| [Session Management](./tutorials/05-SESSION_MANAGEMENT.md)     | Persist sessions with AsyncStorage     |

---

## 🐛 Having Issues?

Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common problems and solutions.

---

## 📁 Project Structure Overview

```
passpay-mobile/
├── app/                    # Screens and navigation
│   ├── _layout.tsx         # LazorKit Provider setup
│   ├── welcome.tsx         # Welcome screen
│   └── (tabs)/             # Tab-based navigation
│       ├── index.tsx       # Wallet connection
│       ├── transfer.tsx    # Gasless transfers
│       ├── memo.tsx        # On-chain memos
│       └── stake.tsx       # SOL staking
├── hooks/                  # Custom React hooks
├── services/               # Business logic & Solana interactions
├── utils/                  # Helper functions
├── constants/              # Theme and configuration
├── polyfills.ts           # Required for Solana libraries
└── index.js               # Entry point (loads polyfills first)
```

---

## ⚙️ Configuration

The app is pre-configured for Solana **Devnet**. Configuration is in `app/_layout.tsx`:

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

For mainnet deployment, see the [Deployment Guide](./DEPLOYMENT.md).
