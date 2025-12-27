# PassPay Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 16+** installed ([Download](https://nodejs.org/))
- **Expo CLI** installed globally: `npm install -g expo-cli`
- **iOS Simulator** (Mac only) or **Android Emulator** set up
- **Git** for version control

## 🛠️ Installation Steps

### 1. Install Dependencies

All dependencies are already listed in `package.json`. Simply run:

```bash
npm install
```

This will install:

- LazorKit wallet adapter
- Solana Web3.js and SPL Token
- Raydium SDK
- React Native polyfills (buffer, get-random-values, url-polyfill)
- Expo and React Native dependencies

### 2. Verify Installation

Check that all packages are installed:

```bash
npm list --depth=0
```

You should see all dependencies including:

- `@lazorkit/wallet-mobile-adapter`
- `@raydium-io/raydium-sdk`
- `@solana/web3.js`
- `@solana/spl-token`

### 3. Start Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### 4. Run on Device/Simulator

**For iOS (Mac only):**

```bash
npm run ios
```

**For Android:**

```bash
npm run android
```

**Using Expo Go (Mobile Device):**

1. Install Expo Go from App Store/Play Store
2. Scan the QR code from the terminal
3. App will load on your device

## 🔧 Configuration

### Deep Linking Setup

The app uses the custom URL scheme `passpaymobile://` which is already configured in:

**app.json:**

```json
{
  "expo": {
    "scheme": "passpaymobile"
  }
}
```

### LazorKit Configuration (Devnet)

Located in `app/_layout.tsx`:

```typescript
const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};
```

### For Production (Mainnet):

1. Update RPC URL:

```typescript
rpcUrl: "https://api.mainnet-beta.solana.com";
// Or use a premium RPC like QuickNode, Helius, etc.
```

2. Update cluster simulation in transactions:

```typescript
transactionOptions: {
  clusterSimulation: 'mainnet',
  // ...
}
```

3. Add paymaster API key (if required):

```typescript
configPaymaster: {
  paymasterUrl: 'YOUR_MAINNET_PAYMASTER_URL',
  apiKey: 'YOUR_API_KEY', // Optional
}
```

## 📱 Testing the App

### 1. Wallet Creation Flow

1. Launch the app
2. You'll see the PassPay home screen
3. Tap "Connect with Passkey"
4. The LazorKit portal will open in a browser
5. Follow the biometric authentication prompts
6. You'll be redirected back to the app
7. Your wallet address will be displayed

### 2. SOL Transfer Flow

1. Navigate to "Transfer" tab
2. Enter a recipient Solana address
3. Enter amount in SOL (e.g., 0.01)
4. Tap "Send SOL"
5. Confirm with passkey authentication
6. Transaction signature will be displayed

**Test Recipient Address (Devnet):**
You can use any valid Solana address. For testing, use:

```
4Ujf5fXfLx2PAwRqcECCLtgDxHKPznoJpa43jUBxFfMz
```

### 3. Token Swap Flow

1. Navigate to "Swap" tab
2. Select tokens (SOL ↔ USDC)
3. Enter amount to swap
4. Tap "Swap Tokens"
5. Review the demo flow

**Note:** The swap screen currently shows a demonstration flow. For production, you need to implement the full Raydium integration (see PRODUCTION_NOTES.md).

## 🐛 Troubleshooting

### "Cannot resolve module" errors

Ensure all polyfills are correctly imported at the top of `app/_layout.tsx`:

```typescript
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;
```

### Deep linking not working

1. Make sure the app scheme matches in all files
2. Clear Expo cache: `expo start -c`
3. Rebuild the app

### Biometric authentication fails

1. Ensure device/simulator has biometric authentication enabled
2. On iOS Simulator: Hardware → Touch ID/Face ID → Enrolled
3. On Android Emulator: Settings → Security → Fingerprint

### Transaction fails

1. Verify you're on Devnet
2. Check wallet has sufficient balance (request devnet SOL from faucet)
3. Enable debug mode: `isDebug={true}` in LazorKitProvider
4. Check console logs for detailed errors

### Expo/React Native issues

```bash
# Clear cache
expo start -c

# Reset Metro bundler
rm -rf node_modules
npm install
expo start -c

# iOS-specific
cd ios && pod install && cd ..
```

## 🎯 Next Steps

1. **Test thoroughly** - Try all three features
2. **Request Devnet SOL** - Use Solana faucet to fund your wallet
3. **Implement production Raydium** - See PRODUCTION_NOTES.md
4. **Add error handling** - Improve user feedback
5. **Deploy** - Build for production with EAS Build

## 📚 Resources

- [LazorKit Docs](https://docs.lazorkit.com)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Raydium SDK](https://github.com/raydium-io/raydium-sdk)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)

## 💰 Get Devnet SOL

To test transfers, you need devnet SOL:

```bash
# Using Solana CLI
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# Or use web faucets:
# - https://faucet.solana.com/
# - https://solfaucet.com/
```

## 🚀 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

Need help? Check the README.md or create an issue in the repository.
