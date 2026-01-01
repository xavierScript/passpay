# Expo Go vs Standalone Build - Deep Linking Fix

## Problem

When using **Expo Go** app for local development, the passkey connection would fail because:

- The app was using `passpaymobile://` scheme
- Expo Go uses its own `exp://` scheme for deep linking
- After authentication, LazorKit portal couldn't redirect back to the app
- Loading spinner would continue indefinitely

## Solution

Created a dynamic redirect URL utility that detects the environment and uses the correct scheme.

### File: `utils/redirect-url.ts`

```typescript
export function getRedirectUrl(path: string = ""): string {
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    // Expo Go: exp://192.168.x.x:8081/--/path
    return Linking.createURL(path);
  } else {
    // Standalone: passpaymobile://path
    return `passpaymobile://${path}`;
  }
}
```

### Updated Files

- ✅ `app/(tabs)/index.tsx` - Connect & Sign Message
- ✅ `app/(tabs)/swap.tsx` - Swap transactions
- ✅ `app/(tabs)/transfer.tsx` - Transfer transactions

## How It Works

### Expo Go (Development)

```
User clicks "Connect with Passkey"
  ↓
Opens LazorKit portal in browser
  ↓
User authenticates with passkey
  ↓
Redirects to: exp://192.168.1.100:8081/--/
  ↓
App receives callback ✅
  ↓
Connection successful!
```

### Standalone Build (Production)

```
User clicks "Connect with Passkey"
  ↓
Opens LazorKit portal in browser
  ↓
User authenticates with passkey
  ↓
Redirects to: passpaymobile://
  ↓
App receives callback ✅
  ↓
Connection successful!
```

## Testing

### Expo Go

```bash
npm start
# Press 'i' for iOS or 'a' for Android
# Or scan QR code with Expo Go app
```

Now click "Connect with Passkey" - it should work!

### Standalone Build

```bash
eas build --profile development --platform android
# Install on device
# Click "Connect with Passkey" - works!
```

## Console Output

You'll now see helpful logs:

- 📱 "Using Expo Go redirect URL: exp://..." (when in Expo Go)
- 🏗️ "Using standalone redirect URL: passpaymobile://..." (when in build)

## Benefits

✅ **No more build-test cycles** for development  
✅ **Instant reload** with Expo Go  
✅ **Same code** works in both environments  
✅ **Production builds** unaffected

## Usage

In your code, simply use:

```typescript
import { getRedirectUrl } from "@/utils/redirect-url";

await connect({
  redirectUrl: getRedirectUrl(),
  // ...
});

await signAndSendTransaction(tx, {
  redirectUrl: getRedirectUrl("swap"), // with path
  // ...
});
```

That's it! The utility handles everything automatically.
