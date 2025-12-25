# Setting up Passkey Wallets

This tutorial walks through implementing passkey-based authentication using Lazorkit SDK.

## Overview

Passkeys replace seed phrases with biometric authentication (FaceID, TouchID, Windows Hello). The Lazorkit SDK handles:

- WebAuthn credential creation
- Smart wallet PDA derivation
- Session persistence
- Fallback authentication for non-biometric devices

## Step 1: Setup Lazorkit Provider

Wrap your app with `LazorkitProvider` to initialize the SDK:

```tsx
// app/providers.tsx
"use client";
import { LazorkitProvider } from "@lazorkit/wallet";
import { DEFAULT_CONFIG } from "@/lib/constants";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LazorkitProvider
      rpcUrl={DEFAULT_CONFIG.rpcUrl}
      portalUrl={DEFAULT_CONFIG.portalUrl}
      paymasterConfig={DEFAULT_CONFIG.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
```

## Step 2: Create Passkey Login Component

Use the `useWallet` hook to access authentication methods:

```tsx
// components/PasskeySetup.tsx
"use client";
import { useWallet } from "@lazorkit/wallet";
import { Button } from "@/components/ui/button";

export function PasskeySetup({
  onConnected,
}: {
  onConnected: (address: string) => void;
}) {
  const { connect, isConnecting, wallet } = useWallet();

  async function handleConnect() {
    try {
      const info = await connect({ feeMode: "paymaster" });
      console.log("Connected:", info.smartWallet);
      onConnected(info.smartWallet);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? "Connecting..." : "Login with Biometrics"}
    </Button>
  );
}
```

## Step 3: Detect WebAuthn Support

Check if the user's device supports passkeys:

```tsx
import { useEffect, useState } from "react";

function usePasskeySupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      !!(window as any).PublicKeyCredential &&
      !!navigator.credentials;
    setSupported(isSupported);
  }, []);

  return supported;
}
```

## Step 4: Handle Fallback Authentication

For devices without biometric support, provide alternative auth:

```tsx
function PasskeyLogin() {
  const supported = usePasskeySupport();

  if (supported === false) {
    return (
      <div className="alert">
        Your device doesn't support biometric login.
        <Button onClick={handlePinLogin}>Use PIN Instead</Button>
      </div>
    );
  }

  return <Button onClick={handlePasskeyLogin}>Login with Biometrics</Button>;
}
```

## Step 5: Store Credential Securely

After successful authentication, encrypt and store the credential ID:

```tsx
import { encryptLocal } from "@/lib/utils";

async function handleConnect() {
  const info = await connect({ feeMode: "paymaster" });

  // Encrypt credential ID before storing
  const encrypted = await encryptLocal(info.credentialId);
  localStorage.setItem("lk_credential", encrypted);
}
```

## Step 6: Session Restoration

On page load, check for existing session:

```tsx
useEffect(() => {
  const restore = async () => {
    const stored = localStorage.getItem("lk_credential");
    if (stored) {
      const credentialId = await decryptLocal(stored);
      // Lazorkit automatically restores if credential is valid
      await connect({ feeMode: "paymaster" });
    }
  };
  restore();
}, []);
```

## Error Handling

Common errors and solutions:

### NotAllowedError

**Cause:** User cancelled the passkey prompt.  
**Solution:** Show user-friendly message encouraging retry.

### NotSupportedError

**Cause:** Browser doesn't support WebAuthn.  
**Solution:** Display browser upgrade prompt.

### NetworkError

**Cause:** Connection to Lazorkit portal failed.  
**Solution:** Retry with exponential backoff.

```tsx
async function handleConnectWithRetry() {
  let attempts = 0;
  while (attempts < 3) {
    try {
      return await connect({ feeMode: "paymaster" });
    } catch (error) {
      attempts++;
      if (attempts >= 3) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempts));
    }
  }
}
```

## Best Practices

1. **Loading States:** Show spinner during wallet creation (can take 3-5 seconds)
2. **Clear Messaging:** Explain what passkeys are to first-time users
3. **Secure Storage:** Never store credential IDs in plain text
4. **Session Expiry:** Invalidate sessions after 7 days
5. **Mobile Testing:** Test on real iOS/Android devices

## Next Steps

- [Implementing Subscriptions](./02-subscription-flow.md)
- [Production Deployment](./03-production.md)
