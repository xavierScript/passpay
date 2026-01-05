# 🏗️ Architecture Overview

Understanding how PassPay Web is structured and how LazorKit integrates with the application.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PASSPAY WEB ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                 UI LAYER                                     │
│                            (Next.js App Router)                              │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │  Login   │  │ Transfer │  │  Staking │  │   Memo   │  │Subscribe │    │
│   │   Page   │  │   Page   │  │   Page   │  │   Page   │  │   Page   │    │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│        │             │             │             │             │           │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┼───────────┘
         │             │             │             │             │
         ▼             ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               HOOKS LAYER                                    │
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │  useTransaction   │  │    useTransfer    │  │   useSolBalance   │      │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘      │
│             │                      │                      │                 │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐      │
│   │    useStaking     │  │    useMemoHook    │  │  useSubscription  │      │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘      │
│                                    │                                         │
│   ┌───────────────────┐            │                                         │
│   │    useSession     │ ◄──────────┘   Session Management                   │
│   └───────────────────┘                                                      │
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
│   │                    - Balance fetching                            │      │
│   └───────────────────────────────┬─────────────────────────────────┘      │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LAZORKIT SDK                                     │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │                      LazorkitProvider                            │      │
│   │                  (Wraps entire application)                      │      │
│   └───────────────────────────────┬─────────────────────────────────┘      │
│                                   │                                         │
│   ┌──────────────┐  ┌─────────────────────────┐  ┌──────────────────┐      │
│   │   useWallet  │  │ signAndSendTransaction  │  │     connect      │      │
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
│   │ WebAuthn     │  │    Blockchain           │  │    Fee           │      │
│   │ & Signing    │  │    Transactions         │  │    Sponsorship   │      │
│   └──────────────┘  └─────────────────────────┘  └──────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
passpay-web/
├── app/                          # 📱 Next.js App Router
│   ├── layout.tsx                # Root layout (HTML structure)
│   ├── providers.tsx             # LazorkitProvider setup
│   ├── page.tsx                  # Home/landing page
│   ├── globals.css               # Global styles
│   │
│   ├── (auth)/                   # 🔐 Authentication routes
│   │   ├── layout.tsx            # Auth layout (unprotected)
│   │   └── login/                # Passkey login page
│   │       └── page.tsx
│   │
│   └── (dashboard)/              # 📊 Protected dashboard routes
│       ├── layout.tsx            # Dashboard layout (requires auth)
│       ├── transfer/             # SOL transfer page
│       │   └── page.tsx
│       ├── memo/                 # On-chain memo page
│       │   └── page.tsx
│       ├── staking/              # SOL staking page
│       │   └── page.tsx
│       ├── subscribe/            # Subscription plans page
│       │   └── page.tsx
│       ├── manage/               # Account management
│       │   └── page.tsx
│       └── premium/              # Gated content
│           └── page.tsx
│
├── features/                     # 🎯 Feature-based organization
│   ├── wallet/                   # Wallet feature
│   │   └── hooks/
│   │       ├── index.ts
│   │       ├── useSolBalance.ts
│   │       └── useTransaction.ts
│   │
│   ├── transfer/                 # Transfer feature
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   └── useTransfer.ts
│   │   └── services/
│   │       ├── index.ts
│   │       └── transfer.service.ts
│   │
│   ├── staking/                  # Staking feature
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   └── useStaking.ts
│   │   └── services/
│   │       ├── index.ts
│   │       └── staking.service.ts
│   │
│   ├── memo/                     # Memo feature
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   └── useMemo.ts
│   │   └── services/
│   │       ├── index.ts
│   │       └── memo.service.ts
│   │
│   ├── subscription/             # Subscription feature
│   │   ├── hooks/
│   │   │   ├── index.ts
│   │   │   └── useSubscription.ts
│   │   └── services/
│   │       ├── index.ts
│   │       └── subscription.service.ts
│   │
│   └── session/                  # Session management feature
│       ├── index.ts
│       ├── hooks/
│       │   ├── index.ts
│       │   └── useSession.ts
│       └── services/
│           ├── index.ts
│           └── session.service.ts
│
├── components/                   # 🧩 React Components
│   ├── index.ts                  # Central exports
│   ├── SubscriptionGate.tsx      # Content gating component
│   │
│   ├── common/                   # Shared components
│   │   ├── index.ts
│   │   ├── Logo.tsx              # PassPay logo component
│   │   ├── PasskeySetup.tsx      # Passkey connection flow
│   │   ├── WalletConnect.tsx     # Wallet connection UI
│   │   └── MobileNav.tsx         # Mobile navigation
│   │
│   ├── dashboard/                # Dashboard-specific components
│   │   └── ...
│   │
│   └── ui/                       # Shadcn UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/                        # 🪝 Custom React Hooks (re-exports)
│   └── index.ts                  # Re-exports from features/
│
├── lib/                          # ⚙️ Utilities & Services
│   ├── constants.ts              # Configuration constants
│   ├── utils.ts                  # Helper functions
│   ├── debug.ts                  # Debug utilities
│   │
│   └── services/                 # Service re-exports
│       ├── index.ts              # Re-exports from features/
│       └── rpc.ts                # Connection singleton
│
├── tests/                        # 🧪 Test Files
│   ├── constants.test.ts
│   └── services/
│       └── ...
│
├── public/                       # 📂 Static assets
│   └── ...
│
├── middleware.ts                 # 🔒 Auth middleware
├── next.config.ts                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

---

## Data Flow

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PASSKEY AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

    User                  Your App                 LazorKit Portal
      │                      │                           │
      │  1. Click "Login"    │                           │
      │─────────────────────>│                           │
      │                      │                           │
      │                      │  2. connect()             │
      │                      │──────────────────────────>│
      │                      │                           │
      │  3. WebAuthn prompt  │                           │
      │<─────────────────────│                           │
      │                      │                           │
      │  4. Biometric auth   │                           │
      │  (FaceID/TouchID)    │                           │
      │─────────────────────>│                           │
      │                      │                           │
      │                      │  5. Credential created    │
      │                      │<──────────────────────────│
      │                      │                           │
      │  6. Redirect to      │                           │
      │     dashboard        │                           │
      │<─────────────────────│                           │
      ▼                      ▼                           ▼
```

### Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRANSACTION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    Component          Hook              Service           LazorKit
        │               │                   │                 │
        │ handleSend()  │                   │                 │
        │──────────────>│                   │                 │
        │               │                   │                 │
        │               │ createInstruction │                 │
        │               │──────────────────>│                 │
        │               │                   │                 │
        │               │ instruction       │                 │
        │               │<──────────────────│                 │
        │               │                   │                 │
        │               │ signAndSendTx()   │                 │
        │               │────────────────────────────────────>│
        │               │                   │                 │
        │               │                   │    Passkey      │
        │               │                   │    Prompt       │
        │               │                   │<────────────────│
        │               │                   │                 │
        │               │ signature         │                 │
        │               │<────────────────────────────────────│
        │               │                   │                 │
        │ success!      │                   │                 │
        │<──────────────│                   │                 │
        ▼               ▼                   ▼                 ▼
```

---

## Layer Responsibilities

### UI Layer (Pages)

- **Purpose**: Render user interface, handle user input
- **Location**: `app/` directory
- **Contains**: Route components, layout files
- **Imports from**: Components, Hooks (via re-exports)

### Features Layer

- **Purpose**: Organize code by feature domains (wallet, transfer, staking, memo, subscription)
- **Location**: `features/` directory
- **Structure**: Each feature has `hooks/` and/or `services/` subdirectories
- **Benefits**: Better code organization, easier to locate feature-specific logic
- **Imports from**: Services within same feature, cross-feature imports via re-exports

### Components Layer

- **Purpose**: Reusable UI building blocks
- **Location**: `components/` directory
- **Contains**: React components in `common/`, `dashboard/`, and `ui/` subdirectories
- **Imports from**: Hooks (via re-exports), Utils

### Hooks Layer (Re-exports)

- **Purpose**: Provide backward-compatible imports for all hooks
- **Location**: `hooks/index.ts` - re-exports from `features/*/hooks/`
- **Contains**: Hook re-exports organized by feature
- **Imports from**: Feature hooks

**Example import paths:**

```typescript
// New feature-based import (recommended)
import { useSolBalance } from "@/features/wallet/hooks";

// Backward-compatible import (also works)
import { useSolBalance } from "@/hooks";
```

### Services Layer (Re-exports)

- **Purpose**: Business logic, Solana interactions, provide backward-compatible imports
- **Location**:
  - `features/*/services/*.service.ts` - actual service implementations
  - `lib/services/index.ts` - re-exports for backward compatibility
- **Contains**: Pure functions, instruction builders
- **Imports from**: @solana/web3.js, constants

**Example import paths:**

```typescript
// New feature-based import (recommended)
import { createTransferInstruction } from "@/features/transfer/services";

// Backward-compatible import (also works)
import { createTransferInstruction } from "@/lib/services";
```

---

## Key Design Patterns

### 1. Composition over Inheritance

Hooks compose smaller hooks:

```typescript
export function useTransfer() {
  const { execute } = useTransaction();        // Reuse transaction logic
  const { balance, refresh } = useSolBalance(); // Reuse balance logic

  const transfer = async (...) => {
    const sig = await execute([instruction]);
    if (sig) refresh();
    return sig;
  };

  return { transfer, balance, ... };
}
```

### 2. Separation of Concerns

Services handle business logic, hooks handle state:

```typescript
// Service: Pure function, easy to test
export function createTransferInstruction(from, to, amount) {
  return SystemProgram.transfer({ ... });
}

// Hook: State management, side effects
export function useTransfer() {
  const [loading, setLoading] = useState(false);
  // ... orchestrate service calls
}
```

### 3. Consistent Error Handling

All hooks use the same error parsing pattern:

```typescript
function parseTransactionError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("NotAllowedError")) {
    return "You cancelled the passkey prompt.";
  }
  // ... more patterns

  return message;
}
```

---

## Next.js Specific Patterns

### Route Groups

```
app/
├── (auth)/           # Unauthenticated routes
│   └── login/
└── (dashboard)/      # Authenticated routes
    └── transfer/
```

Route groups `(auth)` and `(dashboard)` allow different layouts without affecting the URL structure.

### Server vs Client Components

```typescript
// Default: Server Component (no "use client")
// app/page.tsx
export default function Page() { ... }

// Client Component (needs interactivity)
// components/PasskeySetup.tsx
"use client";
import { useState } from "react";
```

### Middleware for Auth

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const hasSession = request.cookies.get("session");

  if (!isAuthRoute && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```
