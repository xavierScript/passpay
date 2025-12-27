# PassPay - Passkey-Powered Solana Wallet

A minimal React Native dApp demonstrating LazorKit SDK integration with Raydium swap functionality for passkey-based Solana transactions.

## 🎯 Features

1. **Passkey Wallet Creation** - Create wallets using biometric authentication (FaceID, TouchID, Fingerprint)
2. **SOL Transfer** - Send SOL with gasless transactions via paymaster
3. **Raydium Token Swap** - Swap tokens on Raydium DEX with passkey verification

## 🏗️ Tech Stack

- **React Native** with Expo
- **LazorKit SDK** - Passkey wallet adapter for mobile
- **Solana Web3.js** - Solana blockchain interactions
- **Raydium SDK** - DEX swap functionality
- **TypeScript** - Type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📱 App Structure

```
app/
├── _layout.tsx          # Root layout with LazorKit provider
├── (tabs)/
│   ├── _layout.tsx      # Tab navigation
│   ├── index.tsx        # Wallet creation/connection
│   ├── transfer.tsx     # SOL transfer
│   └── swap.tsx         # Raydium swap
constants/
└── theme.ts             # App colors (Solana green theme)
```

## 🔐 Deep Linking

The app uses the scheme `passpaymobile://` for LazorKit redirects:

- Wallet connection: `passpaymobile://home`
- Transfer: `passpaymobile://transfer`
- Swap: `passpaymobile://callback`

## 🎨 Design

Clean dark theme with Solana branding:

```typescript
const colors = {
  background: "#000000",
  card: "#1A1A1A",
  primary: "#14F195", // Solana green
  text: "#FFFFFF",
  gray: "#8F8F8F",
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

## 📖 Key Implementation Details

### 1. Wallet Creation

Uses LazorKit's `connect()` method with biometric authentication:

```typescript
const { connect, wallet, isConnected } = useWallet();

await connect({
  redirectUrl: "passpaymobile://home",
  onSuccess: (wallet) => console.log(wallet.smartWallet),
});
```

### 2. SOL Transfer (Gasless)

Creates system transfer instruction and signs with passkey:

```typescript
const ix = SystemProgram.transfer({
  fromPubkey: new PublicKey(wallet.smartWallet),
  toPubkey: recipientPubkey,
  lamports: amount * LAMPORTS_PER_SOL,
});

await signAndSendTransaction(
  {
    instructions: [ix],
    transactionOptions: {
      feeToken: "USDC",
      clusterSimulation: "devnet",
    },
  },
  {
    redirectUrl: "passpaymobile://transfer",
  }
);
```

### 3. Raydium Swap

Production implementation would:

1. Fetch pool keys from Raydium API
2. Calculate swap amounts with slippage
3. Create swap instruction
4. Sign with passkey
5. Send gasless transaction

```typescript
// Production code (commented in swap.tsx)
const { innerTransaction } = await Liquidity.makeSwapInstruction({
  poolKeys,
  userKeys: { owner, tokenAccountIn, tokenAccountOut },
  amountIn,
  amountOut: minimumAmountOut,
  fixedSide: "in",
});
```

## 🔍 Testing

1. **Connect Wallet** - Tap "Connect with Passkey" → Use biometric auth
2. **Transfer SOL** - Navigate to Transfer tab → Enter recipient & amount → Confirm with passkey
3. **Swap Tokens** - Navigate to Swap tab → Select tokens & amount → Execute swap

## 📦 Dependencies

Key packages:

```json
{
  "@lazorkit/wallet-mobile-adapter": "^1.0.0",
  "@raydium-io/raydium-sdk": "^1.3.1-beta.58",
  "@solana/web3.js": "^1.98.0",
  "@solana/spl-token": "^0.4.9",
  "react-native-get-random-values": "^1.11.0",
  "react-native-url-polyfill": "^2.0.0",
  "buffer": "^6.0.3"
}
```

## 🌐 Network

Currently configured for **Solana Devnet**. For mainnet:

1. Update RPC URL in `app/_layout.tsx`
2. Change `clusterSimulation` to `'mainnet'`
3. Update paymaster URL (if available)

## 🎥 Demo Flow

1. Launch app → See PassPay branding
2. Tap "Connect with Passkey" → Portal opens
3. Complete biometric auth → Wallet created
4. View wallet address on home screen
5. Navigate to Transfer → Send SOL gaslessly
6. Navigate to Swap → Demo Raydium integration

## 📄 License

MIT

## 🙏 Acknowledgments

- [LazorKit](https://lazorkit.com) - Passkey wallet infrastructure
- [Raydium](https://raydium.io) - Solana DEX
- [Solana](https://solana.com) - Blockchain platform

---

Built with ❤️ for the LazorKit bounty submission
