# LazorKit Integration Guide - PassPay

A simple demonstration of LazorKit's core features: **Passkey Wallet Creation** and **Gasless USDC Subscriptions** on Solana.

## 🎯 What This App Demonstrates

### 1. **Passkey Wallet Creation (No Seed Phrases!)**

- Users create a Solana wallet using biometric authentication (FaceID/TouchID/Windows Hello)
- No private keys to manage or seed phrases to write down
- Wallet is a smart account (PDA) controlled by the LazorKit program
- Device-bound credentials stored in Secure Enclave

### 2. **Gasless USDC Transactions**

- LazorKit Paymaster sponsors all transaction fees
- Users only need USDC - never need SOL for gas
- Real USDC transfers for subscription payments
- Seamless UX without gas fee complexity

---

## 🛠️ LazorKit Integration Steps

### Step 1: Install Dependencies

```bash
npm install @lazorkit/wallet @solana/web3.js @solana/spl-token
```

### Step 2: Configure Provider

**File: `app/providers.tsx`**

```tsx
import { LazorkitProvider } from "@lazorkit/wallet";

const CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
  },
};

export function AppProviders({ children }) {
  return (
    <LazorkitProvider
      rpcUrl={CONFIG.rpcUrl}
      portalUrl={CONFIG.portalUrl}
      paymasterConfig={CONFIG.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
```

### Step 3: Create Passkey Wallet

**File: `components/PasskeySetup.tsx`**

```tsx
import { useWallet } from "@lazorkit/wallet";

export function PasskeySetup({ onConnected }) {
  const { connect, isConnecting, wallet } = useWallet();

  async function handleConnect() {
    try {
      const info = await connect({ feeMode: "paymaster" });

      // Wallet created! info contains:
      // - credentialId: WebAuthn credential
      // - smartWallet: Your Solana wallet address
      // - passkeyPubkey: Public key bytes

      onConnected(info.smartWallet);
    } catch (error) {
      console.error("Passkey creation failed:", error);
    }
  }

  return (
    <button onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? "Creating Wallet..." : "✨ Create Wallet with Passkey"}
    </button>
  );
}
```

**Key Points:**

- `connect()` triggers WebAuthn passkey creation
- Returns wallet info including smart wallet address
- `feeMode: 'paymaster'` enables gasless transactions

### Step 4: Send Gasless USDC Transaction

**File: `app/(dashboard)/subscribe/page.tsx`**

```tsx
import { useWallet } from "@lazorkit/wallet";
import { PublicKey } from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export default function SubscribePage() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();

  async function handleSubscribe(planAmount) {
    // 1. Get token accounts
    const usdcMint = new PublicKey(USDC_MINT);
    const recipient = new PublicKey(RECIPIENT_ADDRESS);

    const sourceAta = await getAssociatedTokenAddress(
      usdcMint,
      smartWalletPubkey
    );
    const destinationAta = await getAssociatedTokenAddress(usdcMint, recipient);

    // 2. Create transfer instruction
    const amount = Math.floor(planAmount * 1_000_000); // USDC has 6 decimals

    const transferInstruction = createTransferInstruction(
      sourceAta,
      destinationAta,
      smartWalletPubkey,
      amount
    );

    // 3. Sign and send with LazorKit (GASLESS!)
    const signature = await signAndSendTransaction({
      instructions: [transferInstruction],
      transactionOptions: {
        clusterSimulation: "devnet",
      },
    });

    console.log("✅ Transaction successful:", signature);
    // No gas fees charged to user!
  }

  return <button onClick={() => handleSubscribe(0.05)}>Subscribe</button>;
}
```

**Key Points:**

- `signAndSendTransaction()` handles signing with passkey
- Paymaster automatically pays SOL gas fees
- User only needs USDC in wallet
- Transaction is versioned and optimized by LazorKit

---

## 📋 Configuration Reference

### Environment Variables

Create `.env.local`:

```env
# Solana RPC (Devnet for testing)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# LazorKit API Key (optional for devnet)
NEXT_PUBLIC_LAZORKIT_API_KEY=your_api_key_here

# Devnet USDC Mint
NEXT_PUBLIC_USDC_MINT=Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr

# Recipient address for subscription payments
NEXT_PUBLIC_RECIPIENT_ADDRESS=your_wallet_address_here
```

### Constants Setup

**File: `lib/constants.ts`**

```typescript
export const DEFAULT_CONFIG = {
  rpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY,
  },
  clusterSimulation: "devnet" as const,
};

// Devnet USDC mint
export const USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// Subscription plans
export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    amount: 0.01,
    description: "Access to basic content",
  },
  {
    id: "pro",
    name: "Pro",
    amount: 0.05,
    description: "Premium content + features",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 0.1,
    description: "All content + priority support",
  },
];
```

---

## 🧪 Testing the App

### 1. Create Passkey Wallet

```bash
npm run dev
# Visit http://localhost:3000
# Click "Launch App" → "Create Wallet with Passkey"
# Authenticate with your device biometrics
```

### 2. Fund Your Wallet

```bash
# Your wallet address will be displayed in the dashboard
# Get devnet SOL from https://faucet.solana.com
# Swap for devnet USDC or use a USDC faucet
```

### 3. Subscribe to a Plan

```bash
# Click "Subscribe" in the navigation
# Choose a plan (Basic $0.01, Pro $0.05, or Enterprise $0.10)
# Click "Subscribe" - approve with passkey
# ✨ Transaction completes with ZERO gas fees!
```

### 4. View Dashboard

```bash
# Navigate to "Dashboard"
# See your wallet address, SOL balance, USDC balance
# View active subscription and payment history
```

---

## 🔑 Key LazorKit Hooks & Methods

### `useWallet()`

Returns wallet state and methods:

```typescript
const {
  // State
  isConnected, // boolean - is wallet connected?
  isConnecting, // boolean - connection in progress?
  wallet, // WalletInfo - wallet details
  smartWalletPubkey, // PublicKey - your wallet address

  // Methods
  connect, // () => Promise<WalletInfo>
  disconnect, // () => Promise<void>
  signMessage, // (message: string) => Promise<signature>
  signAndSendTransaction, // (payload) => Promise<signature>
} = useWallet();
```

### `signAndSendTransaction()`

Main method for executing transactions:

```typescript
const signature = await signAndSendTransaction({
  instructions: TransactionInstruction[],
  transactionOptions?: {
    feeToken?: string,                    // Pay gas in specific token
    computeUnitLimit?: number,            // Max compute units
    clusterSimulation?: 'devnet' | 'mainnet',
    addressLookupTableAccounts?: []       // For versioned txs
  }
});
```

---

## 🎓 Article Talking Points

### Why LazorKit?

1. **Better UX**: No seed phrases = lower barrier to entry
2. **Security**: Device-bound passkeys in Secure Enclave
3. **Gasless**: Paymaster removes gas fee complexity
4. **Smart Wallets**: Account abstraction enables advanced features

### Technical Highlights

- **WebAuthn Integration**: Standard browser API for biometrics
- **Program Derived Addresses**: Smart wallet controlled by on-chain program
- **Paymaster Pattern**: Gas sponsorship via bundler/relayer
- **Session Keys**: (Future) Scoped access without constant re-auth

### Code Simplicity

```typescript
// Traditional Solana wallet creation
const keypair = Keypair.generate();
const mnemonic = bip39.generateMnemonic();
// User must write down 12-24 words... 😰

// LazorKit wallet creation
await connect({ feeMode: "paymaster" });
// Done! Wallet created with biometrics ✨
```

---

## 📊 Architecture Overview

```
User Device (Browser)
    ↓
WebAuthn API (Passkey)
    ↓
LazorKit SDK
    ↓
LazorKit Portal (Auth Backend)
    ↓
Solana Smart Wallet (PDA)
    ↓
Paymaster (Gas Sponsorship)
    ↓
Solana Network (Devnet)
```

### Transaction Flow

1. User clicks "Subscribe"
2. App creates USDC transfer instruction
3. `signAndSendTransaction()` called
4. Device prompts for biometric auth
5. Passkey signs transaction
6. Transaction sent to Paymaster
7. Paymaster adds gas payment and submits
8. Transaction confirmed on Solana
9. User's USDC transferred, subscription active

**Zero SOL needed by user!**

---

## 🚀 Production Considerations

### Before Going Live:

1. **Switch to Mainnet**

   - Update RPC URL to mainnet
   - Change USDC mint to mainnet address
   - Update `clusterSimulation` to 'mainnet'

2. **Get LazorKit API Key**

   - Contact LazorKit for production API key
   - Add to `paymasterConfig.apiKey`

3. **Database Integration**

   - Store subscriptions in database
   - Track transaction signatures
   - Implement webhook listeners for recurring billing

4. **Security**
   - Validate all inputs
   - Rate limit API endpoints
   - Implement proper session management

---

## 📚 Resources

- **LazorKit Docs**: https://docs.lazorkit.com
- **LazorKit Portal**: https://portal.lazor.sh
- **Solana Docs**: https://docs.solana.com
- **WebAuthn Guide**: https://webauthn.guide

---

## 🎉 Summary

This app demonstrates LazorKit's powerful features in ~500 lines of code:

✅ **Passkey Wallet Creation** - No seed phrases
✅ **Gasless Transactions** - Paymaster sponsorship
✅ **USDC Subscriptions** - Real on-chain payments
✅ **Simple Integration** - Just a few hooks and methods

Perfect for showcasing how LazorKit makes Solana accessible to mainstream users!
