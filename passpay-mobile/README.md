# PassPay - Passkey-Powered Solana Mobile Wallet

A React Native (Expo) starter template demonstrating **LazorKit SDK** integration for passkey-based Solana wallets with gasless transactions.

> 🎯 **Built for developers** - Clear examples, well-commented code, and step-by-step tutorials to help you integrate LazorKit into your own mobile apps.

## ✨ Features

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| 🔐 **Passkey Wallet**    | Create/connect wallets using biometrics (FaceID, TouchID, Fingerprint) |
| 💸 **Gasless Transfers** | Send SOL without paying gas fees (paymaster sponsored)                 |
| 📝 **On-Chain Memos**    | Write permanent messages on Solana blockchain                          |
| 🥩 **SOL Staking**       | Stake SOL to validators with passkey authentication                    |

## 🏗️ Tech Stack

- **React Native** with Expo (SDK 52)
- **LazorKit SDK** - Passkey wallet adapter for mobile
- **Solana Web3.js** - Blockchain interactions
- **TypeScript** - Type safety throughout

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/passpay-mobile.git
cd passpay-mobile

# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android
```

## 📱 App Structure

```
app/
├── _layout.tsx          # Root layout with LazorKit provider
├── (tabs)/
│   ├── _layout.tsx      # Tab navigation configuration
│   ├── index.tsx        # 🏠 Wallet connection & overview
│   ├── transfer.tsx     # 💸 Gasless SOL transfers
│   ├── memo.tsx         # 📝 On-chain memos
│   └── stake.tsx        # 🥩 SOL staking
services/
├── rpc.ts               # Solana RPC with caching
├── memo.ts              # Memo program utilities
├── staking.ts           # Staking program utilities
└── transfer.ts          # Transfer utilities
utils/
├── helpers.ts           # Common utility functions
└── redirect-url.ts      # Deep link URL builder
constants/
└── theme.ts             # Solana-inspired dark theme
```

## 🔐 Deep Linking

The app uses the scheme `passpaymobile://` for LazorKit redirects:

| Route                      | Purpose                    |
| -------------------------- | -------------------------- |
| `passpaymobile://home`     | Wallet connection callback |
| `passpaymobile://transfer` | Transfer confirmation      |
| `passpaymobile://memo`     | Memo confirmation          |
| `passpaymobile://stake`    | Staking confirmation       |

Configure in `app.json`:

```json
{
  "expo": {
    "scheme": "passpaymobile"
  }
}
```

## 🎨 Theme

Solana-inspired dark theme optimized for OLED screens:

```typescript
export const AppColors = {
  background: "#000000", // Pure black
  card: "#1A1A1A", // Card surfaces
  primary: "#14F195", // Solana green
  text: "#FFFFFF",
  gray: "#8F8F8F",
  error: "#FF4444",
  success: "#14F195",
  warning: "#FFB800",
};
```

## 🔧 Configuration

### LazorKit Setup (Devnet)

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

### Polyfills

Required for Solana Web3.js on React Native (configured in `app/_layout.tsx`):

```typescript
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;
```

## 📖 Tutorials

Each screen includes detailed inline comments explaining the LazorKit integration.
Open the source files to see step-by-step explanations.

---

### 📚 Tutorial 1: Creating a Passkey Wallet

**File:** `app/(tabs)/index.tsx`

LazorKit enables wallet creation using device biometrics instead of seed phrases:

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";

const { connect, isConnected, smartWalletPubkey } = useWallet();

// Initiate passkey authentication
await connect({
  redirectUrl: "passpaymobile://home", // Deep link back to app
  onSuccess: (wallet) => {
    console.log("Wallet address:", wallet.smartWallet);
    // wallet.smartWallet is your on-chain Solana address
  },
  onFail: (error) => {
    console.error("Connection failed:", error);
  },
});
```

**How it works:**

1. `connect()` opens LazorKit's web portal in the device browser
2. User creates or selects an existing passkey
3. Biometric authentication (FaceID/TouchID) is performed
4. Portal redirects back to your app via the `redirectUrl`
5. `smartWalletPubkey` is now available for transactions

---

### 📚 Tutorial 2: Sending Gasless Transactions

**File:** `app/(tabs)/transfer.tsx`

Send SOL without users needing to pay gas fees:

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

const { signAndSendTransaction, smartWalletPubkey } = useWallet();

// 1. Create the transfer instruction
const transferInstruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: recipientPublicKey,
  lamports: 0.1 * LAMPORTS_PER_SOL, // 0.1 SOL
});

// 2. Sign and send with paymaster (gasless)
await signAndSendTransaction(
  {
    instructions: [transferInstruction],
    transactionOptions: {
      feeToken: "USDC", // 👈 Enables gasless! Paymaster pays in USDC
      clusterSimulation: "devnet",
    },
  },
  {
    redirectUrl: "passpaymobile://transfer",
    onSuccess: (signature) => {
      console.log("Transaction sent:", signature);
      // View on explorer: https://explorer.solana.com/tx/{signature}
    },
    onFail: (error) => {
      console.error("Transaction failed:", error);
    },
  }
);
```

**Key points:**

- `feeToken: "USDC"` tells LazorKit to use the paymaster
- The paymaster pays SOL fees on behalf of the user
- Equivalent USDC is deducted from the user's balance
- Perfect for onboarding users who don't have SOL yet!

---

### 📚 Tutorial 3: Staking SOL with Passkeys

**File:** `app/(tabs)/stake.tsx`

Create stake accounts without needing additional keypairs:

```typescript
import { StakeProgram, PublicKey } from "@solana/web3.js";

// Use createAccountWithSeed to avoid needing extra signers
const seed = `stake:${Date.now()}`;
const stakeAccountPubkey = await PublicKey.createWithSeed(
  smartWalletPubkey,
  seed,
  StakeProgram.programId
);

// Create stake account + delegate in one transaction
const createInstruction = StakeProgram.createAccountWithSeed({
  fromPubkey: smartWalletPubkey,
  stakePubkey: stakeAccountPubkey,
  basePubkey: smartWalletPubkey,
  seed,
  authorized: new Authorized(smartWalletPubkey, smartWalletPubkey),
  lockup: new Lockup(0, 0, smartWalletPubkey),
  lamports: stakeAmount + rentExempt,
});

const delegateInstruction = StakeProgram.delegate({
  stakePubkey: stakeAccountPubkey,
  authorizedPubkey: smartWalletPubkey,
  votePubkey: validatorVoteAccount,
});

// Send both instructions atomically
await signAndSendTransaction({
  instructions: [
    ...createInstruction.instructions,
    ...delegateInstruction.instructions,
  ],
  // ... options
});
```

**Why `createAccountWithSeed`?**

- LazorKit only provides the smart wallet signer
- Normal stake accounts need a NEW keypair to sign
- Seed-based accounts derive from existing pubkey, no extra signer needed!

## 🔍 Testing the App

1. **Connect Wallet**

   - Tap "Connect with Passkey"
   - Complete biometric authentication
   - See your wallet address displayed

2. **Send SOL (Gasless)**

   - Navigate to Transfer tab
   - Enter recipient address and amount
   - Confirm with passkey → No gas needed!

3. **Write Memo**

   - Navigate to Memo tab
   - Type a message (up to 500 chars)
   - Submit → Message stored on-chain forever

4. **Stake SOL**
   - Navigate to Stake tab
   - Select validator and amount
   - Confirm → Stake account created

## 📦 Key Dependencies

```json
{
  "@lazorkit/wallet-mobile-adapter": "latest",
  "@solana/web3.js": "^1.98.0",
  "expo": "~52.0.0",
  "react-native-get-random-values": "^1.11.0",
  "react-native-url-polyfill": "^2.0.0",
  "buffer": "^6.0.3"
}
```

## 🌐 Network Configuration

Currently configured for **Solana Devnet**.

For **Mainnet**, update in `app/_layout.tsx`:

```typescript
<LazorKitWalletProvider
  config={{
    rpcUrl: "https://api.mainnet-beta.solana.com",  // Mainnet RPC
    portalUrl: "https://portal.lazor.sh",
    configPaymaster: {
      paymasterUrl: "https://kora.mainnet.lazorkit.com",  // Mainnet paymaster
    },
  }}
>
```

Also update `clusterSimulation` in transaction options to `"mainnet-beta"`.

## 🎥 Demo Flow

1. 📱 Launch app → See PassPay branding
2. 🔐 Tap "Connect with Passkey" → LazorKit portal opens
3. 👆 Complete biometric auth → Wallet created instantly
4. 💰 View wallet address and SOL balance on home screen
5. 💸 Navigate to Transfer → Send SOL gaslessly
6. 📝 Navigate to Memo → Write permanent on-chain message
7. 🥩 Navigate to Stake → Stake SOL to validators

## 📄 License

MIT

## 🔗 Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)
- [LazorKit Telegram](https://t.me/lazorkit)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

---

Built with ❤️ for the LazorKit Bounty | January 2026
