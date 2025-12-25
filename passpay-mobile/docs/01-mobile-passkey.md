# Tutorial 1: Mobile Passkey Integration with Lazorkit

This tutorial walks you through implementing biometric authentication for Solana wallets using Lazorkit's passkey system on React Native.

## Overview

Passkeys replace traditional seed phrases with device-native biometric authentication (Face ID, Touch ID, fingerprint). Users authenticate using the same methods they use to unlock their phones - no complex mnemonics to memorize or write down.

## Prerequisites

- React Native project with Expo
- `expo-local-authentication` installed
- `expo-secure-store` installed
- Lazorkit SDK for React Native

## Step 1: Setup Expo LocalAuthentication

Install the required dependencies:

```bash
npm install expo-local-authentication expo-secure-store
```

Configure permissions in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSFaceIDUsageDescription": "Authenticate to access your Solana wallet"
    }
  },
  "android": {
    "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"]
  },
  "plugins": [
    [
      "expo-local-authentication",
      {
        "faceIDPermission": "Authenticate to access your Solana wallet"
      }
    ]
  ]
}
```

## Step 2: Create Biometric Helper Functions

Create `lib/biometric.ts`:

```typescript
import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  return compatible;
}

export async function isBiometricEnrolled(): Promise<boolean> {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometric(
  promptMessage: string = "Authenticate to continue"
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: "Use PIN",
      disableDeviceFallback: false, // Allow PIN fallback
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: "Authentication failed" };
  }
}
```

## Step 3: Integrate with Lazorkit

### Setup Provider

Wrap your app with `LazorKitProvider`:

```typescript
import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";

export default function App() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{
        paymasterUrl: "https://kora.devnet.lazorkit.com",
      }}
    >
      <YourApp />
    </LazorKitProvider>
  );
}
```

### Create Wallet with Biometric

```typescript
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { authenticateWithBiometric } from "./lib/biometric";

function CreateWalletScreen() {
  const { connect, wallet } = useWallet();

  const handleCreateWallet = async () => {
    // 1. Prompt biometric authentication
    const authResult = await authenticateWithBiometric(
      "Authenticate to create your wallet"
    );

    if (!authResult.success) {
      Alert.alert("Authentication Failed", authResult.error);
      return;
    }

    // 2. Create wallet via Lazorkit
    await connect({
      redirectUrl: "passpay://home",
      onSuccess: (walletInfo) => {
        console.log("Wallet created:", walletInfo.smartWallet);
        // Store wallet info securely
      },
      onFail: (error) => {
        Alert.alert("Error", "Failed to create wallet");
      },
    });
  };

  return (
    <Button title="Create Wallet with Face ID" onPress={handleCreateWallet} />
  );
}
```

## Step 4: Store Credentials Securely

Create `lib/storage.ts`:

```typescript
import * as SecureStore from "expo-secure-store";

export async function storeWalletInfo(walletInfo: WalletInfo) {
  await SecureStore.setItemAsync("wallet_address", walletInfo.smartWallet);
  await SecureStore.setItemAsync("credential_id", walletInfo.credentialId);
  await SecureStore.setItemAsync("platform", walletInfo.platform);
}

export async function retrieveWalletInfo(): Promise<WalletInfo | null> {
  const smartWallet = await SecureStore.getItemAsync("wallet_address");
  const credentialId = await SecureStore.getItemAsync("credential_id");
  const platform = await SecureStore.getItemAsync("platform");

  if (!smartWallet || !credentialId || !platform) {
    return null;
  }

  return { smartWallet, credentialId, platform };
}

export async function clearWalletData() {
  await SecureStore.deleteItemAsync("wallet_address");
  await SecureStore.deleteItemAsync("credential_id");
  await SecureStore.deleteItemAsync("platform");
}
```

## Step 5: Restore Wallet Session

```typescript
function App() {
  const { connect, isConnected } = useWallet();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    const storedWallet = await retrieveWalletInfo();

    if (storedWallet && !isConnected) {
      // Reconnect to existing wallet
      await connect({
        redirectUrl: "passpay://home",
      });
    }

    setIsRestoring(false);
  };

  if (isRestoring) {
    return <LoadingScreen />;
  }

  return isConnected ? <HomeScreen /> : <OnboardingScreen />;
}
```

## Step 6: Handle Biometric Failures

```typescript
const handleBiometricAuth = async () => {
  const authResult = await authenticateWithBiometric("Confirm transaction");

  if (!authResult.success) {
    if (authResult.error?.includes("cancel")) {
      // User cancelled - do nothing
      return;
    }

    if (authResult.error?.includes("lockout")) {
      Alert.alert(
        "Too Many Attempts",
        "Please try again later or use your device PIN"
      );
      return;
    }

    if (authResult.error?.includes("not_enrolled")) {
      Alert.alert(
        "Setup Required",
        "Please set up Face ID in your device settings",
        [
          { text: "Cancel" },
          { text: "Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // Generic error
    Alert.alert("Authentication Failed", "Please try again");
  }
};
```

## Best Practices

### 1. Check Availability First

Always check if biometrics are available before attempting authentication:

```typescript
const setupInfo = await getBiometricSetupInfo();

if (!setupInfo.available) {
  // Device doesn't support biometrics
  // Show alternative authentication method
}

if (!setupInfo.enrolled) {
  // User hasn't set up biometrics
  // Prompt them to enable in settings
}
```

### 2. Provide Clear Prompts

Use descriptive messages that explain why authentication is needed:

```typescript
await authenticateWithBiometric("Confirm sending 10 USDC to John");
```

### 3. Handle All Error Cases

```typescript
- user_cancel: User cancelled authentication
- lockout: Too many failed attempts
- not_available: Device doesn't support biometrics
- not_enrolled: Biometrics not set up
- unknown: Other errors
```

### 4. Fallback to PIN

Always allow PIN fallback for accessibility:

```typescript
await LocalAuthentication.authenticateAsync({
  promptMessage: "Authenticate with Face ID",
  fallbackLabel: "Use PIN",
  disableDeviceFallback: false, // Important!
});
```

### 5. Secure Storage Only

Never store credentials in AsyncStorage or plain text:

```typescript
// ✅ Correct
await SecureStore.setItemAsync("credential", value);

// ❌ Wrong
await AsyncStorage.setItem("credential", value);
```

## Testing

### iOS Simulator

1. Enable Face ID: Features → Face ID → Enrolled
2. Simulate success: Features → Face ID → Matching Face
3. Simulate failure: Features → Face ID → Non-matching Face

### Android Emulator

1. Enable fingerprint: Settings → Security → Fingerprint
2. Simulate touches via emulator extended controls

### Physical Device

1. Test with actual Face ID/Touch ID
2. Test with device PIN fallback
3. Test lockout scenario (5 failed attempts)

## Common Issues

### "Not available" on Simulator

iOS Simulator: Ensure Face ID is enrolled in settings  
Android Emulator: Ensure fingerprint is configured

### Authentication Always Fails

Check `app.json` permissions are configured correctly and rebuild:

```bash
npx expo prebuild --clean
npx expo run:ios
```

### Storage Not Persisting

SecureStore requires native build - doesn't work in Expo Go for all features. Use development build:

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios
```

## Next Steps

- Implement transaction signing with biometrics (Tutorial 2)
- Add multi-device support
- Implement account recovery flows

## Resources

- [Expo LocalAuthentication Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Lazorkit Mobile Docs](https://docs.lazorkit.com/)
