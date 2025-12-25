# 📱 PassPay Mobile - Lazorkit Wallet Starter

> Create a Solana wallet with Face ID in 10 seconds. Send USDC gaslessly.

A minimalist React Native mobile wallet app demonstrating **Lazorkit's** biometric authentication and gasless USDC transfers on Solana.

## ✨ Features

✅ **Face ID / Touch ID wallet creation** - No seed phrases required  
✅ **Gasless USDC transfers** - Send USDC without paying network fees  
✅ **QR code scanning** - Easy recipient address input  
✅ **Session persistence** - Wallet stays connected across app restarts  
✅ **Clean native mobile UI** - Native feeling design for iOS & Android  
✅ **TypeScript strict mode** - Full type safety  
✅ **Solana Devnet ready** - Test with devnet tokens

## 🏗️ Tech Stack

- **React Native** with Expo SDK 52+
- **TypeScript** strict mode
- **Lazorkit SDK** for React Native ([docs](https://docs.lazorkit.com/))
- **Expo Router** for file-based navigation
- **React Native Reanimated** for smooth animations
- **Solana Web3.js** for blockchain interactions
- **Expo Camera** for QR scanning
- **Expo LocalAuthentication** for biometrics
- **Expo SecureStore** for encrypted storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Clone and navigate to directory
cd passpay-mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

**iOS (with Face ID):**

```bash
npx expo start --ios
```

**Android (with Fingerprint):**

```bash
npx expo start --android
```

**Physical Device:**

1. Install **Expo Go** app from App Store / Play Store
2. Scan QR code from terminal
3. App will launch on your device

## 📖 Usage

### First Time Setup

1. Launch the app
2. Tap "Get Started" on welcome screen
3. Tap "Create Wallet with Face ID" (or Touch ID)
4. Authenticate with biometrics
5. Your wallet is created! 🎉

### Sending USDC

1. From home screen, tap "Send USDC"
2. Enter or scan recipient address
3. Enter amount
4. Tap "Send USDC"
5. Confirm with Face ID
6. Transaction sent gaslessly!

### Receiving USDC

1. From home screen, tap "Receive"
2. Share your wallet address or QR code
3. Sender sends USDC to your address
4. Balance updates automatically

## 🛠️ Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# Solana Configuration
EXPO_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
EXPO_PUBLIC_CLUSTER=devnet

# Lazorkit Configuration
EXPO_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
EXPO_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com
EXPO_PUBLIC_LAZORKIT_API_KEY=your_api_key_here

# USDC Token Mint (Devnet)
EXPO_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# App Configuration
EXPO_PUBLIC_APP_SCHEME=passpay
```

### App Configuration

The `app.json` file contains iOS/Android permissions and settings:

```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "Authenticate to access your Solana wallet",
      "NSCameraUsageDescription": "Scan QR codes for recipient addresses"
    }
  },
  "android": {
    "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT", "CAMERA"]
  }
}
```

## 📁 Project Structure

```
passpay-mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry point
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── welcome.tsx           # Welcome screen
│   │   └── create-wallet.tsx     # Wallet creation
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx             # Home screen
│   │   └── explore.tsx           # Settings screen
│   ├── send.tsx                  # Send USDC modal
│   ├── scan-qr.tsx               # QR scanner
│   └── transaction-success.tsx   # Success screen
├── components/                   # Reusable components
│   └── LoadingOverlay.tsx        # Loading indicator
├── lib/                          # Core utilities
│   ├── lazorkit.ts               # Lazorkit SDK wrapper
│   ├── biometric.ts              # Biometric auth helpers
│   ├── storage.ts                # SecureStore wrapper
│   └── constants.ts              # App constants & config
├── types/                        # TypeScript definitions
│   └── index.ts                  # Type interfaces
├── docs/                         # Documentation
│   ├── 01-mobile-passkey.md      # Passkey tutorial
│   └── 02-gasless-mobile.md      # Gasless transfers tutorial
└── README.md                     # This file
```

## 🔐 Security

- **No seed phrases stored** - Lazorkit manages keys via passkeys
- **Encrypted storage** - All credentials stored in SecureStore
- **Biometric required** - Face ID/Touch ID for all transactions
- **Input validation** - All addresses and amounts validated
- **Secure connections** - HTTPS for all network requests

## 📚 Tutorials

### 1. Mobile Passkey Integration

Learn how to integrate Lazorkit passkey authentication:

```
docs/01-mobile-passkey.md
```

Topics covered:

- Setting up Expo LocalAuthentication
- Creating passkey wallets
- Storing credentials securely
- Handling biometric fallbacks

### 2. Gasless Mobile Transactions

Implement gasless USDC transfers:

```
docs/02-gasless-mobile.md
```

Topics covered:

- Building the send flow
- QR code scanning
- Executing gasless transactions
- Transaction status handling

## 🧪 Testing

### Device Testing Checklist

- [ ] iPhone with Face ID (iOS 16+)
- [ ] Android with fingerprint (Android 10+)
- [ ] Device without biometrics (PIN fallback)

### Flow Testing

- [ ] Create wallet → Success screen
- [ ] Send USDC → Transaction confirms
- [ ] Scan QR code → Address populates
- [ ] Insufficient balance → Error shown
- [ ] App restart → Session persists
- [ ] Logout → Credential cleared

### Edge Cases

- [ ] No internet connection
- [ ] Biometric fails 3 times
- [ ] Camera permission denied
- [ ] Invalid Solana address entered
- [ ] Transaction timeout

## 🎨 Customization

### Color Scheme

Edit `lib/constants.ts` to change colors:

```typescript
export const COLORS = {
  primary: "#14F195", // Solana green
  background: "#000000", // Black
  card: "#1A1A1A", // Dark gray
  text: "#FFFFFF", // White
  // ... more colors
};
```

### Typography

```typescript
export const TYPOGRAPHY = {
  sizes: {
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    // ... more sizes
  },
};
```

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Biometric authentication not working

1. Check device settings - ensure Face ID/Touch ID is set up
2. Check `app.json` - verify permissions are configured
3. iOS: Check Info.plist usage descriptions

### Camera not scanning QR codes

1. Grant camera permissions in device settings
2. Ensure good lighting for QR code
3. Check `expo-camera` is installed

### Lazorkit connection fails

1. Verify `.env` configuration
2. Check internet connection
3. Ensure Lazorkit services are running

## 📝 License

MIT License - feel free to use this starter for your projects!

## 🙏 Acknowledgments

- **Lazorkit** for the amazing SDK
- **Expo** for the best React Native development experience
- **Solana** for the fast, low-cost blockchain

## 🔗 Links

- [Lazorkit Documentation](https://docs.lazorkit.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [Solana Documentation](https://docs.solana.com/)
- [React Native](https://reactnative.dev/)

---

Built with ❤️ for the Lazorkit bounty submission
