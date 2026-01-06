# Tutorial 6: Session Management

**Time to complete: 15-20 minutes**

Learn how to implement session persistence using local storage with LazorKit. This tutorial covers managing user sessions, tracking activity, handling session expiry, and persisting user preferences across browser sessions.

---

## 📚 Table of Contents

1. [Understanding Session Management](#understanding-session-management)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Step 1: Create the Session Service](#step-1-create-the-session-service)
5. [Step 2: Build the useSession Hook](#step-2-build-the-usesession-hook)
6. [Step 3: Implementing Session Expiry Warnings](#step-3-implementing-session-expiry-warnings)
7. [Step 4: Managing User Preferences](#step-4-managing-user-preferences)
8. [Step 5: Integrating with Your App](#step-5-integrating-with-your-app)
9. [Complete Code Example](#complete-code-example)
10. [Production Considerations](#production-considerations)
11. [Testing Your Implementation](#testing-your-implementation)

---

## Understanding Session Management

Session management allows users to stay authenticated across page refreshes and browser sessions. With local storage persistence, users don't need to reconnect their passkey wallet every time they visit your app.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESSION MANAGEMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    User                   Your App               Local Storage          Wallet
      │                        │                      │                      │
      │  1. Connect wallet     │                      │                      │
      │───────────────────────>│                      │                      │
      │                        │  2. Auth with passkey │                      │
      │                        │─────────────────────>│                      │
      │                        │                      │<─────────────────────│
      │                        │                      │                      │
      │                        │  3. Create session    │                      │
      │                        │─────────────────────>│                      │
      │                        │                      │  4. Store session    │
      │                        │                      │──────────┐           │
      │  5. Dashboard access   │                      │          │           │
      │<───────────────────────│                      │<─────────┘           │
      │                        │                      │                      │
      │  ═══════════ LATER (Page Refresh / New Tab) ═══════════              │
      │                        │                      │                      │
      │  6. Visit app          │                      │                      │
      │───────────────────────>│                      │                      │
      │                        │  7. Check session    │                      │
      │                        │─────────────────────>│                      │
      │                        │  8. Valid session    │                      │
      │                        │<─────────────────────│                      │
      │  9. Auto-restored!     │                      │                      │
      │<───────────────────────│                      │                      │
      ▼                        ▼                      ▼                      ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Result: User stays logged in across sessions without re-authentication     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Use Session Management?

| Benefit                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| **Seamless UX**            | Users don't re-authenticate on every visit  |
| **Faster Access**          | Instant access to dashboard on return       |
| **Preference Persistence** | User settings survive browser restarts      |
| **Activity Tracking**      | Track user engagement and session duration  |
| **Security Control**       | Configurable session expiry and auto-logout |
| **Cross-Tab Sync**         | Session state shared across browser tabs    |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SESSION MANAGEMENT LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         UI LAYER                                     │   │
│   │    App.tsx   │   SessionWarning.tsx   │   PreferencesPanel.tsx       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HOOK LAYER                                   │   │
│   │                        useSession.ts                                 │   │
│   │         - Auto-restore on mount                                      │   │
│   │         - Wallet sync                                                │   │
│   │         - Activity tracking                                          │   │
│   │         - Expiry monitoring                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       SERVICE LAYER                                  │   │
│   │                     session.service.ts                               │   │
│   │         - createSession()                                            │   │
│   │         - getSession()                                               │   │
│   │         - clearSession()                                             │   │
│   │         - updateLastActivity()                                       │   │
│   │         - User preferences                                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       STORAGE LAYER                                  │   │
│   │                       localStorage                                   │   │
│   │         - passpay_session                                            │   │
│   │         - passpay_user_preferences                                   │   │
│   │         - passpay_last_activity                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **Note**: This implementation uses localStorage for session storage. For production apps requiring server-side session validation, consider adding a backend session store with JWT tokens.

---

## Prerequisites

Before starting, ensure you have:

- ✅ A working PassPay Web installation
- ✅ LazorKit SDK configured
- ✅ Basic understanding of React hooks
- ✅ Completed [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md)

---

## Step 1: Create the Session Service

```typescript
// features/session/services/session.service.ts
/**
 * Session Service
 *
 * Manages user session persistence using local storage.
 * Provides utilities for storing, retrieving, and clearing session data.
 */

// Storage keys
const STORAGE_KEYS = {
  SESSION: "passpay_session",
  LAST_ACTIVITY: "passpay_last_activity",
  USER_PREFERENCES: "passpay_user_preferences",
} as const;

// Default session expiry (24 hours in milliseconds)
const DEFAULT_SESSION_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Session data structure
 */
export interface SessionData {
  /** Wallet public key */
  walletAddress: string;
  /** Session creation timestamp */
  createdAt: number;
  /** Session expiry timestamp */
  expiresAt: number;
  /** Last activity timestamp */
  lastActivity: number;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

/**
 * User preferences that persist across sessions
 */
export interface UserPreferences {
  /** Preferred theme */
  theme?: "light" | "dark" | "system";
  /** Whether to show balance */
  showBalance?: boolean;
  /** Default transfer amount */
  defaultTransferAmount?: string;
  /** Notification preferences */
  notifications?: boolean;
}

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Safely get item from localStorage
 */
function safeGetItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get item from localStorage: ${key}`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage
 */
function safeSetItem(key: string, value: string): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set item in localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
function safeRemoveItem(key: string): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from localStorage: ${key}`, error);
    return false;
  }
}
```

_Listing 7-1: Session service foundation with types and safe storage utilities_

This foundation establishes the core patterns for session management. Let's examine the key design decisions:

```typescript
const STORAGE_KEYS = {
  SESSION: "passpay_session",
  LAST_ACTIVITY: "passpay_last_activity",
  USER_PREFERENCES: "passpay_user_preferences",
} as const;
```

Using `as const` creates a readonly object where TypeScript knows the exact string values. This prevents typos when accessing storage keys and enables IDE autocomplete. The prefix `passpay_` namespaces our data to avoid conflicts with other apps.

```typescript
export interface SessionData {
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  isAuthenticated: boolean;
}
```

The `SessionData` interface defines our session model. Key fields:

- `walletAddress`: Links the session to a specific wallet (the user's identity)
- `expiresAt`: Enables time-limited sessions for security
- `lastActivity`: Tracks engagement for analytics and sliding expiry windows
- `isAuthenticated`: Boolean flag for quick validity checks

```typescript
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}
```

The `isBrowser` check is critical for Next.js server-side rendering (SSR). During SSR, `window` and `localStorage` don't exist—accessing them crashes the build. This guard ensures all storage operations gracefully return `null` or `false` during SSR.

```typescript
function safeGetItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get item from localStorage: ${key}`, error);
    return null;
  }
}
```

The `safeGetItem` wrapper adds error handling. localStorage can throw exceptions (e.g., in private browsing mode with storage disabled, or when quota is exceeded). Wrapping all access in try-catch prevents crashes.

---

Now let's add the core session functions:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Create a new session
 */
export function createSession(
  walletAddress: string,
  config: { expiryMs?: number } = {}
): SessionData | null {
  const { expiryMs = DEFAULT_SESSION_EXPIRY } = config;

  const now = Date.now();
  const sessionData: SessionData = {
    walletAddress,
    createdAt: now,
    expiresAt: now + expiryMs,
    lastActivity: now,
    isAuthenticated: true,
  };

  const success = safeSetItem(
    STORAGE_KEYS.SESSION,
    JSON.stringify(sessionData)
  );

  if (success) {
    updateLastActivity();
    return sessionData;
  }

  return null;
}

/**
 * Get the current session
 */
export function getSession(): SessionData | null {
  const stored = safeGetItem(STORAGE_KEYS.SESSION);

  if (!stored) return null;

  try {
    const session: SessionData = JSON.parse(stored);

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session data:", error);
    clearSession();
    return null;
  }
}

/**
 * Check if there's an active valid session
 */
export function hasValidSession(): boolean {
  const session = getSession();
  return session !== null && session.isAuthenticated;
}

/**
 * Update the last activity timestamp
 */
export function updateLastActivity(): boolean {
  const session = getSession();

  if (!session) return false;

  session.lastActivity = Date.now();
  return safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clear the current session
 */
export function clearSession(): boolean {
  return safeRemoveItem(STORAGE_KEYS.SESSION);
}
```

_Listing 7-2: Core session lifecycle functions_

Let's break down the session lifecycle logic:

```typescript
export function createSession(
  walletAddress: string,
  config: { expiryMs?: number } = {}
): SessionData | null {
  const { expiryMs = DEFAULT_SESSION_EXPIRY } = config;

  const now = Date.now();
  const sessionData: SessionData = {
    walletAddress,
    createdAt: now,
    expiresAt: now + expiryMs,
    lastActivity: now,
    isAuthenticated: true,
  };
```

When creating a session, we capture the current timestamp for all time-related fields. The `expiresAt` is calculated by adding the expiry duration to `now`. Using `Date.now()` (milliseconds since epoch) instead of `Date` objects ensures consistent serialization to JSON.

```typescript
export function getSession(): SessionData | null {
  const stored = safeGetItem(STORAGE_KEYS.SESSION);

  if (!stored) return null;

  try {
    const session: SessionData = JSON.parse(stored);

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session data:", error);
    clearSession();
    return null;
  }
}
```

The `getSession` function does more than just retrieve—it validates. If the session has expired (`Date.now() > session.expiresAt`), it automatically clears the stale data and returns `null`. This "lazy cleanup" pattern ensures expired sessions are never returned to callers.

The `try-catch` around `JSON.parse` handles corrupted data gracefully. If someone manually edits localStorage and breaks the JSON, we clear it rather than crashing.

```typescript
export function hasValidSession(): boolean {
  const session = getSession();
  return session !== null && session.isAuthenticated;
}
```

This is a convenience function for quick validity checks. It combines existence check with authentication state—a session might exist but be marked as unauthenticated during a logout flow.

---

Now let's add session expiry management:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Extend the session expiry
 */
export function extendSession(
  additionalMs: number = DEFAULT_SESSION_EXPIRY
): SessionData | null {
  const session = getSession();

  if (!session) return null;

  session.expiresAt = Date.now() + additionalMs;
  session.lastActivity = Date.now();

  const success = safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  return success ? session : null;
}

/**
 * Get session time remaining in milliseconds
 */
export function getSessionTimeRemaining(): number {
  const session = getSession();
  if (!session) return 0;

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if session is about to expire (within threshold)
 */
export function isSessionExpiringSoon(
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  const remaining = getSessionTimeRemaining();
  return remaining > 0 && remaining <= thresholdMs;
}

/**
 * Clear all session-related data (full logout)
 */
export function clearAllSessionData(keepPreferences: boolean = true): boolean {
  const sessionCleared = clearSession();
  const activityCleared = safeRemoveItem(STORAGE_KEYS.LAST_ACTIVITY);

  if (!keepPreferences) {
    safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  return sessionCleared && activityCleared;
}
```

_Listing 7-3: Session expiry and cleanup utilities_

These functions handle the session lifecycle after creation:

```typescript
export function extendSession(
  additionalMs: number = DEFAULT_SESSION_EXPIRY
): SessionData | null {
  const session = getSession();

  if (!session) return null;

  session.expiresAt = Date.now() + additionalMs;
  session.lastActivity = Date.now();
```

The `extendSession` function implements a common UX pattern: allowing users to "stay logged in" when their session is about to expire. It resets `expiresAt` from the current time, not from the old expiry—this prevents accumulating time indefinitely.

```typescript
export function isSessionExpiringSoon(
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  const remaining = getSessionTimeRemaining();
  return remaining > 0 && remaining <= thresholdMs;
}
```

The `remaining > 0` check is important—it ensures we only warn for sessions that are still valid. A session with 0 remaining time is already expired, not "expiring soon."

```typescript
export function clearAllSessionData(keepPreferences: boolean = true): boolean {
  const sessionCleared = clearSession();
  const activityCleared = safeRemoveItem(STORAGE_KEYS.LAST_ACTIVITY);

  if (!keepPreferences) {
    safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  return sessionCleared && activityCleared;
}
```

The `keepPreferences` parameter enables two logout modes:

- **Soft logout** (`keepPreferences: true`): User logs out but their theme, notification settings, etc. persist for next time
- **Hard logout** (`keepPreferences: false`): Complete reset, useful for "sign out everywhere" or account switching

---

Finally, let's add user preferences management:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Save user preferences
 */
export function saveUserPreferences(preferences: UserPreferences): boolean {
  const current = getUserPreferences();
  const merged = { ...current, ...preferences };
  return safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(merged));
}

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  const stored = safeGetItem(STORAGE_KEYS.USER_PREFERENCES);

  if (!stored) {
    return {
      theme: "system",
      showBalance: true,
      notifications: true,
    };
  }

  try {
    return JSON.parse(stored) as UserPreferences;
  } catch (error) {
    console.error("Failed to parse user preferences:", error);
    return {
      theme: "system",
      showBalance: true,
      notifications: true,
    };
  }
}
```

_Listing 7-4: User preferences storage with sensible defaults_

```typescript
export function saveUserPreferences(preferences: UserPreferences): boolean {
  const current = getUserPreferences();
  const merged = { ...current, ...preferences };
  return safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(merged));
}
```

The merge pattern (`{ ...current, ...preferences }`) enables partial updates. You can call `saveUserPreferences({ theme: 'dark' })` without losing other preferences like `showBalance` or `notifications`.

```typescript
if (!stored) {
  return {
    theme: "system",
    showBalance: true,
    notifications: true,
  };
}
```

Returning sensible defaults when no preferences exist ensures the app always has valid configuration. This eliminates null checks throughout the UI code.

---

## Step 2: Build the useSession Hook

```typescript
// features/session/hooks/useSession.ts
/**
 * useSession Hook
 *
 * Custom hook for managing user session persistence.
 * Integrates with LazorKit wallet and provides automatic session handling.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@lazorkit/wallet";
import {
  SessionData,
  UserPreferences,
  createSession,
  getSession,
  clearSession,
  updateLastActivity,
  extendSession,
  hasValidSession,
  getSessionTimeRemaining,
  isSessionExpiringSoon,
  saveUserPreferences,
  getUserPreferences,
  clearAllSessionData,
} from "../services";

export interface UseSessionOptions {
  /** Auto-restore session on mount */
  autoRestore?: boolean;
  /** Auto-sync with wallet connection state */
  autoSync?: boolean;
  /** Session expiry in milliseconds (default: 24 hours) */
  sessionExpiryMs?: number;
  /** Expiry warning threshold in ms (default: 5 minutes) */
  expiryWarningMs?: number;
  /** Activity tracking interval in ms (default: 1 minute) */
  activityTrackingIntervalMs?: number;
}

export interface UseSessionReturn {
  session: SessionData | null;
  preferences: UserPreferences;
  isRestoring: boolean;
  isValid: boolean;
  isExpiringSoon: boolean;
  timeRemaining: number;
  createNewSession: (walletAddress?: string) => SessionData | null;
  endSession: (keepPreferences?: boolean) => void;
  extendCurrentSession: (additionalMs?: number) => SessionData | null;
  updatePreferences: (prefs: Partial<UserPreferences>) => boolean;
  refresh: () => void;
}

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    autoRestore = true,
    autoSync = true,
    sessionExpiryMs = 24 * 60 * 60 * 1000,
    expiryWarningMs = 5 * 60 * 1000,
    activityTrackingIntervalMs = 60 * 1000,
  } = options;

  const { smartWalletPubkey, isConnected } = useWallet();

  const [session, setSession] = useState<SessionData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(
    getUserPreferences()
  );
  const [isRestoring, setIsRestoring] = useState(autoRestore);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const hasRestoredRef = useRef(false);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ... (methods defined below)
}
```

_Listing 7-5: useSession hook setup with configuration options_

Let's examine the hook architecture:

```typescript
export interface UseSessionOptions {
  autoRestore?: boolean;
  autoSync?: boolean;
  sessionExpiryMs?: number;
  expiryWarningMs?: number;
  activityTrackingIntervalMs?: number;
}
```

The options interface makes the hook configurable. Default values (`autoRestore = true`, etc.) mean it works out-of-the-box while allowing customization for specific use cases.

```typescript
const { smartWalletPubkey, isConnected } = useWallet();
```

We compose `useWallet` from LazorKit to access wallet state. This enables automatic session creation when the wallet connects—the key integration point.

```typescript
const hasRestoredRef = useRef(false);
const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

We use `useRef` for values that shouldn't trigger re-renders:

- `hasRestoredRef`: Prevents double-restoration in React Strict Mode
- `activityIntervalRef`: Stores interval IDs for cleanup
- `expiryCheckIntervalRef`: Stores expiry check interval ID

---

Now let's add the hook methods:

```typescript
// features/session/hooks/useSession.ts (continued)

/**
 * Refresh session state from storage
 */
const refresh = useCallback(() => {
  const storedSession = getSession();
  setSession(storedSession);
  setPreferences(getUserPreferences());
  setTimeRemaining(getSessionTimeRemaining());
  setIsExpiringSoon(isSessionExpiringSoon(expiryWarningMs));
}, [expiryWarningMs]);

/**
 * Create a new session
 */
const createNewSession = useCallback(
  (walletAddress?: string): SessionData | null => {
    const address = walletAddress || smartWalletPubkey?.toBase58();

    if (!address) {
      console.warn("Cannot create session: No wallet address provided");
      return null;
    }

    const newSession = createSession(address, { expiryMs: sessionExpiryMs });

    if (newSession) {
      setSession(newSession);
      setTimeRemaining(sessionExpiryMs);
      setIsExpiringSoon(false);
    }

    return newSession;
  },
  [smartWalletPubkey, sessionExpiryMs]
);

/**
 * End the current session
 */
const endSession = useCallback((keepPreferences: boolean = true) => {
  clearAllSessionData(keepPreferences);
  setSession(null);
  setTimeRemaining(0);
  setIsExpiringSoon(false);

  if (!keepPreferences) {
    setPreferences({
      theme: "system",
      showBalance: true,
      notifications: true,
    });
  }
}, []);

/**
 * Extend the current session
 */
const extendCurrentSession = useCallback(
  (additionalMs?: number): SessionData | null => {
    const extended = extendSession(additionalMs || sessionExpiryMs);

    if (extended) {
      setSession(extended);
      setTimeRemaining(getSessionTimeRemaining());
      setIsExpiringSoon(false);
    }

    return extended;
  },
  [sessionExpiryMs]
);

/**
 * Update user preferences
 */
const updatePreferences = useCallback(
  (prefs: Partial<UserPreferences>): boolean => {
    const success = saveUserPreferences(prefs as UserPreferences);

    if (success) {
      setPreferences((current) => ({ ...current, ...prefs }));
    }

    return success;
  },
  []
);
```

_Listing 7-6: Hook methods for session management_

All methods are wrapped in `useCallback` for performance:

```typescript
const createNewSession = useCallback(
  (walletAddress?: string): SessionData | null => {
    const address = walletAddress || smartWalletPubkey?.toBase58();
```

The `createNewSession` function accepts an optional wallet address. If not provided, it falls back to the connected wallet. This flexibility allows manual session creation for testing or edge cases.

```typescript
const endSession = useCallback((keepPreferences: boolean = true) => {
  clearAllSessionData(keepPreferences);
  setSession(null);
  setTimeRemaining(0);
  setIsExpiringSoon(false);
```

The `endSession` function updates both localStorage (via `clearAllSessionData`) and React state. This dual update ensures the UI immediately reflects the logged-out state.

---

Now let's add the automatic effects:

```typescript
// features/session/hooks/useSession.ts (continued)

/**
 * Restore session on mount
 */
useEffect(() => {
  if (autoRestore && !hasRestoredRef.current) {
    hasRestoredRef.current = true;
    setIsRestoring(true);

    // Small delay to ensure localStorage is available
    const timer = setTimeout(() => {
      refresh();
      setIsRestoring(false);
    }, 50);

    return () => clearTimeout(timer);
  }
}, [autoRestore, refresh]);

/**
 * Auto-sync with wallet connection
 */
useEffect(() => {
  if (!autoSync) return;

  if (isConnected && smartWalletPubkey) {
    const currentSession = getSession();
    const walletAddress = smartWalletPubkey.toBase58();

    // Create session if none exists or wallet changed
    if (!currentSession || currentSession.walletAddress !== walletAddress) {
      createNewSession(walletAddress);
    } else {
      // Update activity for existing session
      updateLastActivity();
      refresh();
    }
  }
}, [autoSync, isConnected, smartWalletPubkey, createNewSession, refresh]);

/**
 * Track activity and update last activity timestamp
 */
useEffect(() => {
  if (!session) return;

  const handleActivity = () => {
    updateLastActivity();
  };

  // Listen for user activity
  window.addEventListener("click", handleActivity);
  window.addEventListener("keydown", handleActivity);
  window.addEventListener("scroll", handleActivity);
  window.addEventListener("mousemove", handleActivity);

  // Periodic activity update
  activityIntervalRef.current = setInterval(() => {
    if (hasValidSession()) {
      updateLastActivity();
    }
  }, activityTrackingIntervalMs);

  return () => {
    window.removeEventListener("click", handleActivity);
    window.removeEventListener("keydown", handleActivity);
    window.removeEventListener("scroll", handleActivity);
    window.removeEventListener("mousemove", handleActivity);

    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }
  };
}, [session, activityTrackingIntervalMs]);

/**
 * Check session expiry periodically
 */
useEffect(() => {
  if (!session) return;

  const checkExpiry = () => {
    const remaining = getSessionTimeRemaining();
    setTimeRemaining(remaining);
    setIsExpiringSoon(isSessionExpiringSoon(expiryWarningMs));

    // Session has expired
    if (remaining === 0) {
      setSession(null);
      clearSession();
    }
  };

  // Check every 10 seconds
  expiryCheckIntervalRef.current = setInterval(checkExpiry, 10 * 1000);
  checkExpiry(); // Initial check

  return () => {
    if (expiryCheckIntervalRef.current) {
      clearInterval(expiryCheckIntervalRef.current);
    }
  };
}, [session, expiryWarningMs]);

return {
  session,
  preferences,
  isRestoring,
  isValid: session !== null && hasValidSession(),
  isExpiringSoon,
  timeRemaining,
  createNewSession,
  endSession,
  extendCurrentSession,
  updatePreferences,
  refresh,
};
```

_Listing 7-7: Automatic effects for session restoration, wallet sync, and expiry monitoring_

Let's examine each effect:

```typescript
useEffect(() => {
  if (autoRestore && !hasRestoredRef.current) {
    hasRestoredRef.current = true;
    setIsRestoring(true);

    const timer = setTimeout(() => {
      refresh();
      setIsRestoring(false);
    }, 50);
```

The restoration effect runs once on mount. The 50ms delay ensures hydration is complete in Next.js before accessing localStorage. The `hasRestoredRef` flag prevents double-execution in React Strict Mode.

```typescript
useEffect(() => {
  if (!autoSync) return;

  if (isConnected && smartWalletPubkey) {
    const currentSession = getSession();
    const walletAddress = smartWalletPubkey.toBase58();

    if (!currentSession || currentSession.walletAddress !== walletAddress) {
      createNewSession(walletAddress);
    }
```

The wallet sync effect creates a session when the wallet connects. It also handles wallet switching—if the user connects a different wallet, a new session is created for that wallet address.

```typescript
window.addEventListener("click", handleActivity);
window.addEventListener("keydown", handleActivity);
window.addEventListener("scroll", handleActivity);
window.addEventListener("mousemove", handleActivity);
```

Activity tracking listens to multiple event types to detect any user interaction. This keeps `lastActivity` current for analytics and potential sliding expiry windows.

```typescript
expiryCheckIntervalRef.current = setInterval(checkExpiry, 10 * 1000);
```

The expiry check runs every 10 seconds to update `timeRemaining` and `isExpiringSoon`. This frequency balances responsiveness with performance—checking every second would be wasteful.

---

## Step 3: Implementing Session Expiry Warnings

```tsx
// components/SessionExpiryWarning.tsx
"use client";

import { useSession } from "@/hooks";

export function SessionExpiryWarning() {
  const { isExpiringSoon, timeRemaining, extendCurrentSession, endSession } =
    useSession();

  if (!isExpiringSoon) return null;

  const minutesLeft = Math.floor(timeRemaining / 60000);
  const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold">Session Expiring Soon</h3>
      <p>
        Your session will expire in {minutesLeft}:
        {secondsLeft.toString().padStart(2, "0")}
      </p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => extendCurrentSession()}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Stay Logged In
        </button>
        <button
          onClick={() => endSession()}
          className="bg-white text-black px-4 py-2 rounded border"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
```

_Listing 7-8: Session expiry warning component with extend/logout options_

```typescript
if (!isExpiringSoon) return null;
```

The component only renders when `isExpiringSoon` is true—when the session has less than 5 minutes remaining (configurable via `expiryWarningMs`).

```typescript
const minutesLeft = Math.floor(timeRemaining / 60000);
const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);
```

We convert milliseconds to a human-readable format. The modulo operation (`% 60000`) extracts remaining seconds after full minutes.

```typescript
{
  secondsLeft.toString().padStart(2, "0");
}
```

`padStart(2, "0")` ensures single-digit seconds display as "05" instead of "5", matching clock conventions.

### Adding to Your Layout

```tsx
// app/(dashboard)/layout.tsx
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <SessionExpiryWarning />
    </>
  );
}
```

_Listing 7-9: Adding session warning to dashboard layout_

---

## Step 4: Managing User Preferences

```tsx
// components/SettingsPanel.tsx
"use client";

import { useSession } from "@/hooks";

export function SettingsPanel() {
  const { preferences, updatePreferences } = useSession();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="flex items-center justify-between">
        <label>Theme</label>
        <select
          value={preferences.theme}
          onChange={(e) =>
            updatePreferences({
              theme: e.target.value as "light" | "dark" | "system",
            })
          }
          className="border rounded p-2"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label>Show Balance</label>
        <input
          type="checkbox"
          checked={preferences.showBalance}
          onChange={(e) => updatePreferences({ showBalance: e.target.checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <label>Enable Notifications</label>
        <input
          type="checkbox"
          checked={preferences.notifications}
          onChange={(e) =>
            updatePreferences({ notifications: e.target.checked })
          }
        />
      </div>
    </div>
  );
}
```

_Listing 7-10: Settings panel for managing user preferences_

```typescript
onChange={(e) =>
  updatePreferences({
    theme: e.target.value as "light" | "dark" | "system",
  })
}
```

Each change calls `updatePreferences` with only the changed field. The service merges this with existing preferences, so you don't need to pass the entire object.

---

## Step 5: Integrating with Your App

### Protected Route Wrapper

```tsx
// components/ProtectedRoute.tsx
"use client";

import { useSession } from "@/hooks";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isValid, isRestoring } = useSession();

  useEffect(() => {
    if (!isRestoring && !isValid) {
      redirect("/login");
    }
  }, [isValid, isRestoring]);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary rounded-full border-t-transparent" />
      </div>
    );
  }

  if (!isValid) {
    return null;
  }

  return <>{children}</>;
}
```

_Listing 7-11: Protected route component for authenticated pages_

```typescript
useEffect(() => {
  if (!isRestoring && !isValid) {
    redirect("/login");
  }
}, [isValid, isRestoring]);
```

The redirect only fires after restoration completes (`!isRestoring`). This prevents a flash redirect before we've checked localStorage for an existing session.

```typescript
if (isRestoring) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary rounded-full border-t-transparent" />
    </div>
  );
}
```

Showing a loading spinner during restoration prevents layout flicker. The user sees a brief spinner instead of the login page flashing before the dashboard appears.

### Dashboard Layout with Session

```tsx
// app/(dashboard)/layout.tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        {children}
        <SessionExpiryWarning />
      </main>
    </ProtectedRoute>
  );
}
```

_Listing 7-12: Dashboard layout combining protection and session warnings_

### Logout Button

```tsx
// components/LogoutButton.tsx
"use client";

import { useSession } from "@/hooks";
import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { endSession } = useSession();
  const { disconnect } = useWallet();
  const router = useRouter();

  const handleLogout = () => {
    endSession(true); // Keep user preferences
    disconnect(); // Disconnect wallet
    router.push("/login");
  };

  return (
    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">
      Logout
    </button>
  );
}
```

_Listing 7-13: Logout button with session and wallet cleanup_

```typescript
const handleLogout = () => {
  endSession(true); // Keep user preferences
  disconnect(); // Disconnect wallet
  router.push("/login");
};
```

The logout flow does three things:

1. `endSession(true)`: Clears session but keeps preferences (theme, etc.)
2. `disconnect()`: Disconnects the LazorKit wallet
3. `router.push("/login")`: Navigates to login page

---

## Complete Code Example

### Full App Integration

```tsx
// app/page.tsx
"use client";

import { useSession } from "@/hooks";
import { useWallet } from "@lazorkit/wallet";

export default function App() {
  const { isConnected, connect } = useWallet();
  const {
    session,
    isValid,
    isRestoring,
    isExpiringSoon,
    timeRemaining,
    preferences,
    endSession,
    extendCurrentSession,
    updatePreferences,
  } = useSession();

  // Session is automatically synced with wallet connection
  // When wallet connects, session is created
  // When page reloads, session is restored from localStorage

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Restoring session...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Welcome to PassPay</h1>
        <button
          onClick={connect}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg"
        >
          Connect with Passkey
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {session?.walletAddress.slice(0, 8)}...
          </span>
          <button onClick={() => endSession()} className="text-red-500 text-sm">
            Logout
          </button>
        </div>
      </header>

      {/* Session expiry warning */}
      {isExpiringSoon && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
          <p>
            Session expires in {Math.floor(timeRemaining / 60000)} minutes.
            <button
              onClick={() => extendCurrentSession()}
              className="ml-2 text-blue-500 underline"
            >
              Extend
            </button>
          </p>
        </div>
      )}

      {/* Main content */}
      <main>
        <p>Welcome back! Your session is active.</p>

        {/* Theme preference example */}
        <div className="mt-4">
          <label className="mr-2">Theme:</label>
          <select
            value={preferences.theme}
            onChange={(e) =>
              updatePreferences({
                theme: e.target.value as "light" | "dark" | "system",
              })
            }
            className="border p-1 rounded"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </main>
    </div>
  );
}
```

_Listing 7-14: Complete app integration with session management_

---

## Production Considerations

### Security Best Practices

1. **Session Encryption** (Optional Enhancement)

```typescript
// For sensitive data, consider encrypting session data
import CryptoJS from "crypto-js";

function encryptSession(data: SessionData, key: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

function decryptSession(encrypted: string, key: string): SessionData | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch {
    return null;
  }
}
```

_Listing 7-15: Optional session encryption for sensitive data_

2. **Session Fingerprinting**

```typescript
// Add device fingerprint to detect session hijacking
interface EnhancedSessionData extends SessionData {
  fingerprint: string;
  userAgent: string;
  ipHash?: string;
}
```

_Listing 7-16: Enhanced session data with device fingerprinting_

3. **Token Refresh Strategy**

```typescript
// Implement sliding window expiry
const ACTIVITY_EXTENSION = 30 * 60 * 1000; // 30 minutes

function onUserActivity() {
  if (hasValidSession()) {
    extendSession(ACTIVITY_EXTENSION);
  }
}
```

_Listing 7-17: Sliding window session extension on activity_

### Storage Limits

- localStorage has a ~5MB limit per origin
- Session data is typically < 1KB
- User preferences should be < 10KB
- Consider IndexedDB for larger data needs

### Cross-Tab Synchronization

```typescript
// Listen for storage changes from other tabs
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "passpay_session") {
      refresh(); // Update session state
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, [refresh]);
```

_Listing 7-18: Cross-tab session synchronization_

When a user logs out in one tab, this listener updates other tabs. The `storage` event only fires in other tabs, not the one that made the change.

---

## Testing Your Implementation

### Unit Tests

```typescript
// __tests__/session.service.test.ts
import {
  createSession,
  getSession,
  clearSession,
  hasValidSession,
  extendSession,
} from "@/features/session/services";

describe("Session Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates a session", () => {
    const session = createSession("test-wallet-address");
    expect(session).not.toBeNull();
    expect(session?.walletAddress).toBe("test-wallet-address");
    expect(session?.isAuthenticated).toBe(true);
  });

  it("retrieves a valid session", () => {
    createSession("test-wallet");
    const session = getSession();
    expect(session).not.toBeNull();
    expect(hasValidSession()).toBe(true);
  });

  it("clears a session", () => {
    createSession("test-wallet");
    clearSession();
    expect(getSession()).toBeNull();
    expect(hasValidSession()).toBe(false);
  });

  it("detects expired sessions", () => {
    createSession("test-wallet", { expiryMs: -1000 }); // Already expired
    expect(getSession()).toBeNull();
  });

  it("extends session duration", () => {
    const session = createSession("test-wallet", { expiryMs: 1000 });
    const extended = extendSession(60000);
    expect(extended?.expiresAt).toBeGreaterThan(session!.expiresAt);
  });
});
```

_Listing 7-19: Unit tests for session service functions_

### Integration Tests

```typescript
// __tests__/useSession.test.tsx
import { renderHook, act } from "@testing-library/react";
import { useSession } from "@/features/session/hooks";

describe("useSession Hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restores session on mount", async () => {
    // Pre-create a session
    localStorage.setItem(
      "passpay_session",
      JSON.stringify({
        walletAddress: "test-wallet",
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        lastActivity: Date.now(),
        isAuthenticated: true,
      })
    );

    const { result } = renderHook(() => useSession());

    // Wait for restoration
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.session?.walletAddress).toBe("test-wallet");
  });
});
```

_Listing 7-20: Integration tests for useSession hook_

---

## 🎉 Summary

You've learned how to:

- ✅ Implement session persistence with local storage
- ✅ Create and manage user sessions
- ✅ Track user activity and session expiry
- ✅ Show session expiry warnings
- ✅ Persist user preferences across sessions
- ✅ Integrate session management with your app

### Key Takeaways

1. **Auto-Restore**: Sessions are automatically restored on page load
2. **Wallet Sync**: Sessions stay in sync with wallet connection state
3. **Activity Tracking**: User activity is tracked to keep sessions alive
4. **Expiry Warnings**: Users are warned before their session expires
5. **Preferences**: User preferences persist across sessions

---

## Next Steps

- Explore [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md) for wallet creation
- Learn about [Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- Build [Subscription Payments](./05-SUBSCRIPTION_PAYMENTS.md) with gated content

---

## 📚 Related Documentation

- [API Reference](../API_REFERENCE.md) - Complete hook and service documentation
- [Architecture Overview](../ARCHITECTURE.md) - How PassPay Web is structured
- [Troubleshooting](../TROUBLESHOOTING.md) - Common issues and solutions
