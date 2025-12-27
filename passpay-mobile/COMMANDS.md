# Quick Reference Commands

## 🚀 Getting Started

```bash
# Install all dependencies
npm install

# Start development server
npm start

# Run on iOS Simulator (Mac only)
npm run ios

# Run on Android Emulator
npm run android

# Clear cache and restart
npm start -- --clear
```

## 📱 Testing

### Get Devnet SOL

```bash
# Using Solana CLI (if installed)
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# Or use web faucets:
# https://faucet.solana.com/
# https://solfaucet.com/
```

### Test Addresses (Devnet)

```
# Valid Solana address for testing transfers:
4Ujf5fXfLx2PAwRqcECCLtgDxHKPznoJpa43jUBxFfMz

# Or use your own wallet address
```

## 🔧 Development

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Format code (if prettier is configured)
npx prettier --write .
```

## 🏗️ Building

```bash
# Build for development
expo build:android
expo build:ios

# Using EAS Build (recommended)
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## 🐛 Troubleshooting

```bash
# Clear all caches
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --clear

# iOS specific (Mac only)
cd ios
pod install
cd ..

# Reset Metro bundler
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear Expo cache
expo start -c
```

## 📦 Dependencies

```bash
# Install a new package
npm install package-name

# Install dev dependency
npm install --save-dev package-name

# Update all packages
npm update

# Check for outdated packages
npm outdated
```

## 🔐 Deep Linking Test

```bash
# Test deep link on iOS Simulator
xcrun simctl openurl booted passpaymobile://home

# Test deep link on Android
adb shell am start -W -a android.intent.action.VIEW -d "passpaymobile://home"
```

## 📊 App Info

```bash
# Check React Native version
npx react-native --version

# Check Expo version
expo --version

# Check Node version
node --version

# Check npm version
npm --version
```

## 🌐 Environment

### Current Configuration

- **Network:** Solana Devnet
- **RPC:** https://api.devnet.solana.com
- **Paymaster:** https://kora.devnet.lazorkit.com
- **Portal:** https://portal.lazor.sh

### For Mainnet

Update in `app/_layout.tsx`:

```typescript
rpcUrl: "https://api.mainnet-beta.solana.com";
// And in transaction options:
clusterSimulation: "mainnet";
```

## 📝 Common Tasks

### Update App Icon

```bash
# Place new icon in assets/images/
# Then rebuild the app
```

### Update Splash Screen

```bash
# Place new splash image in assets/images/
# Update app.json splash config
# Rebuild the app
```

### Change App Name

```bash
# Edit app.json:
"name": "Your New Name"
"slug": "your-new-name"

# Then rebuild
```

## 🔍 Debugging

```bash
# Open React Native debugger
# In app: Press Cmd+D (iOS) or Cmd+M (Android)
# Then select "Debug"

# View logs
npx react-native log-ios
npx react-native log-android

# Or use Expo logs
# Logs appear automatically in terminal when running npm start
```

## 📱 Device Testing

### iOS (Physical Device)

```bash
# Requires Apple Developer account
# Configure in Xcode
expo build:ios
# Follow Expo docs for TestFlight
```

### Android (Physical Device)

```bash
# Enable USB debugging on device
# Connect via USB
adb devices
npm run android
```

### Using Expo Go App

```bash
# Install Expo Go from App Store/Play Store
npm start
# Scan QR code with Expo Go app
```

## 🎯 Quick Test Flow

1. **Start app:** `npm start`
2. **Run on device:** `npm run ios` or `npm run android`
3. **Connect wallet:** Tap "Connect with Passkey"
4. **Test transfer:** Go to Transfer tab, use test address above
5. **Test swap:** Go to Swap tab, try demo flow

## 📚 Documentation

- [README.md](README.md) - Main documentation
- [SETUP.md](SETUP.md) - Installation guide
- [PRODUCTION_NOTES.md](PRODUCTION_NOTES.md) - Raydium implementation
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Bounty submission summary

## 🆘 Need Help?

1. Check [SETUP.md](SETUP.md) troubleshooting section
2. Review LazorKit docs: https://docs.lazorkit.com
3. Check Expo docs: https://docs.expo.dev
4. Review Solana docs: https://docs.solana.com

---

**Happy Building! 🚀**
