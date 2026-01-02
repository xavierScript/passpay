# 🏗️ Architecture Overview

Understanding how PassPay is structured and how LazorKit integrates with the application.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PASSPAY ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 UI LAYER                                     │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │ Welcome  │  │  Wallet  │  │ Transfer │  │   Memo   │  │  Stake   │    │
│   │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │    │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│        │             │             │             │             │           │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┼───────────┘
         │             │             │             │             │
         ▼             ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               HOOKS LAYER                                    │
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │  useWalletGuard   │  │useLazorkitTrans.  │  │   useSolBalance   │      │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘      │
│             │                      │                      │                 │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │  useClipboard     │  │  useTxHistory     │  │  useColorScheme   │      │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SERVICES LAYER                                   │
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │   transfer.ts     │  │    staking.ts     │  │      memo.ts      │      │
│   │  - validation     │  │  - stake accts    │  │  - memo instr.    │      │
│   │  - instructions   │  │  - delegation     │  │  - verification   │      │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘      │
│             │                      │                      │                 │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                           rpc.ts                                 │      │
│   │                    - Connection singleton                        │      │
│   │                    - Request caching                             │      │
│   └───────────────────────────────┬─────────────────────────────────┘      │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LAZORKIT SDK                                     │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                      LazorKitProvider                            │      │
│   │                  (Wraps entire application)                      │      │
│   └───────────────────────────────┬─────────────────────────────────┘      │
│                                   │                                         │
│   ┌──────────────┐  ┌─────────────────────────┐  ┌──────────────────┐      │
│   │   useWallet  │  │ signAndSendTransaction  │  │   signMessage    │      │
│   └──────────────┘  └─────────────────────────┘  └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                 │
│                                                                             │
│   ┌──────────────┐  ┌─────────────────────────┐  ┌──────────────────┐      │
│   │ LazorKit     │  │    Solana Devnet        │  │    Paymaster     │      │
│   │ Portal       │  │    RPC                  │  │    Service       │      │
│   │              │  │                         │  │                  │      │
│   │ Authentication│  │    Blockchain          │  │    Fee           │      │
│   │ & Signing    │  │    Transactions         │  │    Sponsorship   │      │
│   └──────────────┘  └─────────────────────────┘  └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
passpay-mobile/
├── app/                          # 📱 Screens (Expo Router)
│   ├── _layout.tsx               # Root layout with LazorKitProvider
│   ├── welcome.tsx               # Welcome/onboarding screen
│   └── (tabs)/                   # Tab-based navigation
│       ├── _layout.tsx           # Tab configuration
│       ├── index.tsx             # Wallet connection screen
│       ├── transfer.tsx          # Gasless SOL transfers
│       ├── memo.tsx              # On-chain memos
│       └── stake.tsx             # Native SOL staking
│
├── hooks/                        # 🪝 Custom React Hooks
│   ├── index.ts                  # Central exports
│   ├── use-lazorkit-transaction.ts  # Transaction handling
│   ├── use-wallet-guard.tsx      # Connection guard
│   ├── use-sol-balance.ts        # Balance fetching
│   ├── use-transaction-history.ts   # History tracking
│   ├── use-clipboard.ts          # Clipboard operations
│   └── use-color-scheme.ts       # Theme detection
│
├── services/                     # ⚙️ Business Logic
│   ├── rpc.ts                    # Solana connection singleton
│   ├── transfer.ts               # Transfer utilities
│   ├── staking.ts                # Staking utilities
│   └── memo.ts                   # Memo utilities
│
├── utils/                        # 🔧 Helper Functions
│   ├── helpers.ts                # Common utilities
│   └── redirect-url.ts           # Deep link URL builder
│
├── constants/                    # 🎨 App Constants
│   └── theme.ts                  # Colors and theme values
│
├── styles/                       # 💅 StyleSheet Definitions
│   ├── index.ts                  # Central exports
│   ├── shared.styles.ts          # Shared styles
│   ├── home.styles.ts            # Wallet screen styles
│   ├── transfer.styles.ts        # Transfer screen styles
│   ├── memo.styles.ts            # Memo screen styles
│   ├── stake.styles.ts           # Stake screen styles
│   └── welcome.styles.ts         # Welcome screen styles
│
├── __tests__/                    # 🧪 Test Files
│   ├── utils/                    # Utility tests
│   ├── services/                 # Service tests
│   └── hooks/                    # Hook tests
│
├── docs/                         # 📚 Documentation
│   ├── README.md                 # Doc index
│   ├── tutorials/                # Step-by-step guides
│   └── ...                       # Other docs
│
├── polyfills.ts                  # 🔌 Required polyfills
├── index.js                      # 📍 App entry point
├── app.json                      # 📋 Expo configuration
└── package.json                  # 📦 Dependencies
```

---

## Data Flow

### 1. Wallet Connection Flow

```
User taps "Connect"
         │
         ▼
┌─────────────────────┐
│  handleConnect()    │  ← HomeScreen (index.tsx)
│  in screen          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  connect()          │  ← useWallet (LazorKit SDK)
│  from useWallet     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Open browser to    │  ← LazorKit Portal
│  portal.lazor.sh    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  User authenticates │  ← Device Biometrics
│  with biometrics    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Redirect back      │  ← Deep Link (passpaymobile://)
│  to app             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  smartWalletPubkey  │  ← App State Updated
│  is now available   │
└─────────────────────┘
```

### 2. Transaction Flow

```
User initiates transaction
         │
         ▼
┌─────────────────────┐
│  Screen Component   │  ← e.g., TransferScreen
│  validates input    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Service creates    │  ← transfer.ts / staking.ts
│  instruction(s)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  useLazorkitTx      │  ← Custom Hook
│  execute()          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  signAndSendTx()    │  ← LazorKit SDK
│  from useWallet     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Portal opens for   │  ← LazorKit Portal
│  biometric signing  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Paymaster sponsors │  ← Paymaster Service
│  transaction fee    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Transaction sent   │  ← Solana Network
│  to Solana          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  onSuccess callback │  ← Back to App
│  with signature     │
└─────────────────────┘
```

---

## Component Relationships

### Provider Hierarchy

```tsx
<LazorKitProvider>
  {" "}
  // LazorKit SDK
  <ThemeProvider>
    {" "}
    // React Navigation
    <Stack>
      {" "}
      // Expo Router
      <Stack.Screen name="welcome" />
      <Stack.Screen
        name="(tabs)" // Tab Navigator
      >
        <Tabs.Screen name="index" /> // Wallet
        <Tabs.Screen name="transfer" /> // Transfer
        <Tabs.Screen name="memo" /> // Memo
        <Tabs.Screen name="stake" /> // Stake
      </Stack.Screen>
    </Stack>
  </ThemeProvider>
</LazorKitProvider>
```

### Hook Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HOOK DEPENDENCIES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

useLazorkitTransaction
├── useWallet (LazorKit)           // For signAndSendTransaction
├── useState (React)               // For loading, error states
└── getRedirectUrl (utils)         // For deep link

useWalletGuard
├── useWallet (LazorKit)           // For isConnected, smartWalletPubkey
└── truncateAddress (utils)        // For display formatting

useSolBalance
├── useWallet (LazorKit)           // For smartWalletPubkey
├── useFocusEffect (Expo Router)   // For screen focus
└── getConnection (services/rpc)   // For balance fetch

useTransactionHistory
├── useState (React)               // For history state
├── useCallback (React)            // For memoized functions
└── getExplorerUrl (utils)         // For explorer links

useClipboard
├── Clipboard (expo-clipboard)     // For copy
└── Haptics (expo-haptics)         // For feedback
```

---

## Key Design Decisions

### 1. Polyfill Loading Order

**Problem**: Solana libraries require `Buffer` and `crypto` before they're imported.

**Solution**: Custom entry point (`index.js`) loads polyfills before Expo Router.

```javascript
// index.js - loads BEFORE expo-router
import "./polyfills"; // Buffer, crypto, URL polyfills
import "expo-router/entry"; // Then start the app
```

### 2. Single Connection Instance

**Problem**: Creating multiple RPC connections causes rate limiting.

**Solution**: Singleton pattern in `services/rpc.ts`.

```typescript
let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(DEVNET_RPC, { commitment: "confirmed" });
  }
  return _connection;
}
```

### 3. Seed-Based Stake Accounts

**Problem**: Stake accounts normally require a new keypair as signer.

**Solution**: Use `createAccountWithSeed` to derive addresses without extra signers.

```typescript
const stakeAccountPubkey = await PublicKey.createWithSeed(
  walletPubkey, // Base
  `stake:${Date.now()}`, // Unique seed
  StakeProgram.programId // Program
);
```

### 4. Custom Hooks for Abstraction

**Problem**: Repeated boilerplate across screens.

**Solution**: Extract patterns into reusable hooks.

```typescript
// Before: 50+ lines per screen
// After: 5 lines
const { execute, loading } = useLazorkitTransaction({ gasless: true });
await execute({ instructions: [ix] });
```

### 5. Redirect URL Handling

**Problem**: Different redirect schemes for Expo Go vs standalone builds.

**Solution**: Dynamic URL generation based on environment.

```typescript
export function getRedirectUrl(path: string = ""): string {
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    return Linking.createURL(path); // exp://...
  }
  return `passpaymobile://${path}`; // Custom scheme
}
```

---

## Security Considerations

### ✅ What LazorKit Handles

| Aspect                   | Implementation                    |
| ------------------------ | --------------------------------- |
| Private Keys             | Stored in device Secure Enclave   |
| Signing                  | Biometric authentication required |
| Session                  | Managed by LazorKit SDK           |
| Transaction Verification | Portal confirms before signing    |

### ⚠️ App Responsibilities

| Aspect               | Implementation                                     |
| -------------------- | -------------------------------------------------- |
| Input Validation     | Validate addresses and amounts before transactions |
| Error Handling       | Graceful failures with user-friendly messages      |
| RPC Security         | Use reputable RPC endpoints                        |
| Deep Link Validation | Validate redirect URLs                             |

---

## Performance Optimizations

### 1. Lazy Loading

```typescript
// Screens loaded on navigation, not app start
<Stack.Screen name="stake" options={{ lazy: true }} />
```

### 2. Memoized Callbacks

```typescript
const fetchBalance = useCallback(async () => {
  // Only recreated when dependencies change
}, [publicKey, connection]);
```

### 3. Request Caching

```typescript
// services/rpc.ts
const cache = new Map<string, { data: T; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds
```

### 4. Focus-Based Updates

```typescript
// Only fetch when screen is visible
useFocusEffect(
  useCallback(() => {
    fetchData();
  }, [])
);
```

---

## Extensibility

### Adding New Features

1. **New Screen**: Add to `app/(tabs)/`
2. **New Service**: Add to `services/`
3. **New Hook**: Add to `hooks/` and export from index
4. **New Styles**: Add to `styles/` and export from index

### Example: Adding Token Transfers

```
1. Create services/token-transfer.ts
   - createTokenTransferInstruction()
   - getTokenBalance()

2. Create hooks/use-token-balance.ts
   - Similar to useSolBalance

3. Create app/(tabs)/token-transfer.tsx
   - Use hooks and services

4. Add styles/token-transfer.styles.ts

5. Add tab to app/(tabs)/_layout.tsx
```

---

## Related Documentation

- [Installation Guide](./INSTALLATION.md)
- [API Reference](./API_REFERENCE.md)
- [Tutorials](./tutorials/)
