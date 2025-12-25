# PassPay Mobile - Complete Setup Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the App](#running-the-app)
5. [Development](#development)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 8.0.0 or higher (comes with Node.js)
- **Expo CLI** (will be installed globally)
- **Git** ([Download](https://git-scm.com/))

### For iOS Development

- **macOS** (required for iOS development)
- **Xcode** 14.0 or higher ([App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods** (`sudo gem install cocoapods`)

### For Android Development

- **Android Studio** ([Download](https://developer.android.com/studio))
- **Android SDK** (API level 31 or higher)
- **Java Development Kit (JDK)** 11 or higher

## Installation

### Step 1: Clone or Navigate to Project

```bash
cd passpay-mobile
```

### Step 2: Install Dependencies

```bash
# Install npm packages
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Verify installation
npx expo --version
```

### Step 3: Install iOS Dependencies (macOS only)

```bash
cd ios
pod install
cd ..
```

## Configuration

### Step 1: Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

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

### Step 2: Get Lazorkit API Key (Optional)

1. Visit [Lazorkit Dashboard](https://portal.lazor.sh)
2. Create an account
3. Generate an API key
4. Add to `.env` file

### Step 3: Configure App Scheme

The app scheme is used for deep linking. Default is `passpay://`.

To customize:

1. Edit `.env`: Change `EXPO_PUBLIC_APP_SCHEME`
2. Edit `app.json`: Change `scheme` field
3. Rebuild the app

## Running the App

### Development Server

Start the Expo development server:

```bash
npx expo start
```

You'll see a QR code and options to run on:

- **Press `i`** - Open in iOS Simulator
- **Press `a`** - Open in Android Emulator
- **Press `w`** - Open in web browser (limited functionality)

### Run on Physical Device

#### iOS (Requires Mac)

1. Install **Expo Go** from App Store
2. Start dev server: `npx expo start`
3. Scan QR code with Camera app
4. App opens in Expo Go

**Note**: For full biometric features, use a development build (see below)

#### Android

1. Install **Expo Go** from Play Store
2. Start dev server: `npx expo start`
3. Scan QR code with Expo Go app
4. App opens in Expo Go

### Development Build (Recommended for Biometrics)

For full biometric authentication support:

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# iOS
npx expo run:ios

# Android
npx expo run:android
```

This creates a custom development build with native modules.

## Development

### Project Structure

```
passpay-mobile/
├── app/                    # Expo Router screens
│   ├── (onboarding)/       # Onboarding flow
│   ├── (tabs)/             # Main app tabs
│   └── *.tsx               # Other screens
├── components/             # Reusable components
├── lib/                    # Core utilities
│   ├── lazorkit.ts         # Lazorkit integration
│   ├── biometric.ts        # Biometric helpers
│   ├── storage.ts          # Secure storage
│   └── constants.ts        # App constants
├── types/                  # TypeScript definitions
├── docs/                   # Documentation
└── assets/                 # Images, fonts, etc.
```

### Key Files

- `app/_layout.tsx` - Root layout with providers
- `lib/constants.ts` - Configuration and constants
- `app.json` - Expo configuration
- `.env` - Environment variables

### Making Changes

1. Edit files in `app/`, `components/`, or `lib/`
2. Changes reload automatically in development
3. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu

### TypeScript

The project uses TypeScript strict mode. Type errors will show in your editor and during build.

## Building for Production

### Create Production Build

#### iOS

```bash
# Create production build
eas build --platform ios

# Or local build
npx expo run:ios --configuration Release
```

Requirements:

- Apple Developer Account ($99/year)
- Provisioning profiles configured
- App Store Connect app created

#### Android

```bash
# Create production build
eas build --platform android

# Or local build
npx expo run:android --variant release
```

Requirements:

- Keystore for signing
- Google Play Developer account ($25 one-time)

### Submit to App Stores

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

## Troubleshooting

### Common Issues

#### "Cannot find module" Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

#### Biometric Not Working

1. **Simulator**: Enable Face ID in Settings → Face ID
2. **Android Emulator**: Configure fingerprint in settings
3. **Physical Device**: Ensure biometrics are enrolled

#### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear

# Or reset entirely
watchman watch-del-all
rm -rf node_modules
npm install
```

#### iOS Pod Install Fails

```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Android Build Fails

```bash
cd android
./gradlew clean
cd ..
```

### Debugging

#### Enable Debug Mode

In `app/_layout.tsx`:

```typescript
<LazorKitProvider
  isDebug={true}  // Enable debug logs
  ...
>
```

#### View Logs

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Or use React Native Debugger
```

#### Check Expo Diagnostics

```bash
npx expo-doctor
```

### Getting Help

- **Expo Forums**: https://forums.expo.dev/
- **Lazorkit Discord**: Check docs for invite link
- **GitHub Issues**: Create an issue in your repo
- **Stack Overflow**: Tag with `expo`, `react-native`, `solana`

## Testing

### Run on Devices

Minimum requirements:

- iOS 13.0+ for Face ID
- Android 6.0+ for Fingerprint

### Test Accounts

Use Solana devnet for testing:

1. Create wallet in app
2. Visit [Sol Faucet](https://solfaucet.com/)
3. Request devnet SOL airdrop
4. Get devnet USDC from test faucet

### Test Scenarios

- [ ] Create new wallet
- [ ] Authenticate with biometrics
- [ ] Send USDC transaction
- [ ] Scan QR code
- [ ] View transaction history
- [ ] Logout and restore session

## Next Steps

1. Read the [README.md](./README.md) for feature overview
2. Follow [Tutorial 1](./docs/01-mobile-passkey.md) for passkey integration
3. Follow [Tutorial 2](./docs/02-gasless-mobile.md) for gasless transactions
4. Customize colors and branding in `lib/constants.ts`
5. Add your own features!

## Support

For issues specific to this starter:

- Check [docs/](./docs/) for tutorials
- Review [troubleshooting](#troubleshooting) section

For Lazorkit SDK issues:

- Visit [Lazorkit Docs](https://docs.lazorkit.com/)
- Check their support channels

## License

MIT - See LICENSE file for details
