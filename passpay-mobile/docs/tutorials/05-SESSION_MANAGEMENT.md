# 🔐 Tutorial 5: Session Management

**Time to complete: 15-20 minutes**

Learn how to implement session persistence using AsyncStorage with LazorKit. This tutorial covers managing user sessions, tracking activity, handling session expiry, and persisting user preferences across app launches.

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

Session management allows users to stay authenticated across app launches and background/foreground transitions. With AsyncStorage persistence, users don't need to reconnect their passkey wallet every time they open your app.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SESSION MANAGEMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    User                   Your App              AsyncStorage          Wallet
      │                        │                      │                    │
      │  1. Connect wallet     │                      │                    │
      │───────────────────────>│                      │                    │
      │                        │  2. Auth with passkey│                    │
      │                        │─────────────────────>│                    │
      │                        │                      │<───────────────────│
      │                        │                      │                    │
      │                        │  3. Create session   │                    │
      │                        │─────────────────────>│                    │
      │                        │                      │  4. Store session  │
      │                        │                      │──────────┐         │
      │  5. Dashboard access   │                      │          │         │
      │<───────────────────────│                      │<─────────┘         │
      │                        │                      │                    │
      │  ═══════════ LATER (App Restart / Background) ═══════════         │
      │                        │                      │                    │
      │  6. Open app           │                      │                    │
      │───────────────────────>│                      │                    │
      │                        │  7. Check session    │                    │
      │                        │─────────────────────>│                    │
      │                        │  8. Valid session    │                    │
      │                        │<─────────────────────│                    │
      │  9. Auto-restored!     │                      │                    │
      │<───────────────────────│                      │                    │
      ▼                        ▼                      ▼                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  Result: User stays logged in across app sessions without re-authentication │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Use Session Management?

| Benefit                    | Description                                 |
| -------------------------- | ------------------------------------------- |
| **Seamless UX**            | Users don't re-authenticate on every launch |
| **Faster Access**          | Instant access to dashboard on return       |
| **Preference Persistence** | User settings survive app restarts          |
| **Activity Tracking**      | Track user engagement and session duration  |
| **Security Control**       | Configurable session expiry and auto-logout |
| **App State Handling**     | Proper background/foreground transitions    |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SESSION MANAGEMENT LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         UI LAYER                                     │   │
│   │    App.tsx   │   SessionWarning   │   SettingsScreen                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HOOK LAYER                                   │   │
│   │                       use-session.ts                                 │   │
│   │         - Auto-restore on mount                                      │   │
│   │         - Wallet sync                                                │   │
│   │         - App state tracking                                         │   │
│   │         - Expiry monitoring                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       SERVICE LAYER                                  │   │
│   │                    session.service.ts                                │   │
│   │         - createSession()                                            │   │
│   │         - getSession()                                               │   │
│   │         - clearSession()                                             │   │
│   │         - updateLastActivity()                                       │   │
│   │         - User preferences                                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       STORAGE LAYER                                  │   │
│   │                       AsyncStorage                                   │   │
│   │         - passpay_session                                            │   │
│   │         - passpay_user_preferences                                   │   │
│   │         - passpay_last_activity                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

> ⚠️ **Note**: This implementation uses AsyncStorage for session storage. For production apps requiring server-side session validation, consider adding a backend session store with JWT tokens.

---

## Prerequisites

Before starting, ensure you have:

- ✅ A working PassPay Mobile installation
- ✅ LazorKit SDK configured
- ✅ `@react-native-async-storage/async-storage` installed
- ✅ Basic understanding of React hooks
- ✅ Completed [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md)

Install AsyncStorage if not already installed:

```bash
npx expo install @react-native-async-storage/async-storage
```

---

## Step 1: Create the Session Service

```typescript
// features/session/services/session.service.ts
/**
 * Session Service
 *
 * Manages user session persistence using AsyncStorage.
 * Provides utilities for storing, retrieving, and clearing session data.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

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
  /** Notification preferences */
  notifications?: boolean;
  /** Haptic feedback enabled */
  hapticFeedback?: boolean;
}
```

_Listing 5-1: Session service foundation with types and storage keys_

This foundation establishes the core patterns for session management. Let's examine the key design decisions:

```typescript
const STORAGE_KEYS = {
  SESSION: "passpay_session",
  LAST_ACTIVITY: "passpay_last_activity",
  USER_PREFERENCES: "passpay_user_preferences",
} as const;
```

Using `as const` creates a readonly object where TypeScript knows the exact string values. This prevents typos when accessing storage keys and enables IDE autocomplete. The prefix `passpay_` namespaces our data to avoid conflicts with other storage.

```typescript
export interface SessionData {
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  isAuthenticated: boolean;
}
```

The `SessionData` interface defines our session model:

- `walletAddress`: Links the session to a specific wallet (the user's identity)
- `expiresAt`: Enables time-limited sessions for security
- `lastActivity`: Tracks engagement for analytics and sliding expiry windows
- `isAuthenticated`: Boolean flag for quick validity checks

---

Now let's add safe storage utilities:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Safely get item from AsyncStorage
 */
async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get item from AsyncStorage: ${key}`, error);
    return null;
  }
}

/**
 * Safely set item in AsyncStorage
 */
async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set item in AsyncStorage: ${key}`, error);
    return false;
  }
}

/**
 * Safely remove item from AsyncStorage
 */
async function safeRemoveItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove item from AsyncStorage: ${key}`, error);
    return false;
  }
}
```

_Listing 5-2: Safe AsyncStorage utilities with error handling_

The `safeGetItem`, `safeSetItem`, and `safeRemoveItem` wrappers add error handling. AsyncStorage can throw exceptions in edge cases (e.g., storage quota exceeded). Wrapping all access in try-catch prevents crashes and returns graceful fallbacks.

---

Now let's add the core session functions:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Create a new session
 */
export async function createSession(
  walletAddress: string,
  config: { expiryMs?: number } = {}
): Promise<SessionData | null> {
  const { expiryMs = DEFAULT_SESSION_EXPIRY } = config;

  const now = Date.now();
  const sessionData: SessionData = {
    walletAddress,
    createdAt: now,
    expiresAt: now + expiryMs,
    lastActivity: now,
    isAuthenticated: true,
  };

  const success = await safeSetItem(
    STORAGE_KEYS.SESSION,
    JSON.stringify(sessionData)
  );

  if (success) {
    await updateLastActivity();
    return sessionData;
  }

  return null;
}

/**
 * Get the current session
 */
export async function getSession(): Promise<SessionData | null> {
  const stored = await safeGetItem(STORAGE_KEYS.SESSION);

  if (!stored) return null;

  try {
    const session: SessionData = JSON.parse(stored);

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session data:", error);
    await clearSession();
    return null;
  }
}

/**
 * Check if there's an active valid session
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.isAuthenticated;
}

/**
 * Update the last activity timestamp
 */
export async function updateLastActivity(): Promise<boolean> {
  const session = await getSession();

  if (!session) return false;

  session.lastActivity = Date.now();
  return await safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clear the current session
 */
export async function clearSession(): Promise<boolean> {
  return await safeRemoveItem(STORAGE_KEYS.SESSION);
}
```

_Listing 5-3: Core session lifecycle functions_

Let's break down the session lifecycle logic:

```typescript
export async function getSession(): Promise<SessionData | null> {
  const stored = await safeGetItem(STORAGE_KEYS.SESSION);

  if (!stored) return null;

  try {
    const session: SessionData = JSON.parse(stored);

    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to parse session data:", error);
    await clearSession();
    return null;
  }
}
```

The `getSession` function does more than just retrieve—it validates. If the session has expired (`Date.now() > session.expiresAt`), it automatically clears the stale data and returns `null`. This "lazy cleanup" pattern ensures expired sessions are never returned to callers.

---

Now let's add session expiry management:

```typescript
// features/session/services/session.service.ts (continued)

/**
 * Extend the session expiry
 */
export async function extendSession(
  additionalMs: number = DEFAULT_SESSION_EXPIRY
): Promise<SessionData | null> {
  const session = await getSession();

  if (!session) return null;

  session.expiresAt = Date.now() + additionalMs;
  session.lastActivity = Date.now();

  const success = await safeSetItem(
    STORAGE_KEYS.SESSION,
    JSON.stringify(session)
  );
  return success ? session : null;
}

/**
 * Get session time remaining in milliseconds
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if session is about to expire (within threshold)
 */
export async function isSessionExpiringSoon(
  thresholdMs: number = 5 * 60 * 1000
): Promise<boolean> {
  const remaining = await getSessionTimeRemaining();
  return remaining > 0 && remaining <= thresholdMs;
}

/**
 * Clear all session-related data (full logout)
 */
export async function clearAllSessionData(
  keepPreferences: boolean = true
): Promise<boolean> {
  const sessionCleared = await clearSession();
  const activityCleared = await safeRemoveItem(STORAGE_KEYS.LAST_ACTIVITY);

  if (!keepPreferences) {
    await safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  return sessionCleared && activityCleared;
}
```

_Listing 5-4: Session expiry and cleanup utilities_

The `extendSession` function implements a common UX pattern: allowing users to "stay logged in" when their session is about to expire. The `clearAllSessionData` function's `keepPreferences` parameter enables two logout modes:

- **Soft logout** (`keepPreferences: true`): User logs out but their theme, haptic settings, etc. persist
- **Hard logout** (`keepPreferences: false`): Complete reset, useful for account switching

---

Finally, let's add user preferences management:

```typescript
// features/session/services/session.service.ts (continued)

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  showBalance: true,
  notifications: true,
  hapticFeedback: true,
};

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  const current = await getUserPreferences();
  const merged = { ...current, ...preferences };
  return await safeSetItem(
    STORAGE_KEYS.USER_PREFERENCES,
    JSON.stringify(merged)
  );
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const stored = await safeGetItem(STORAGE_KEYS.USER_PREFERENCES);

  if (!stored) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch (error) {
    console.error("Failed to parse user preferences:", error);
    return { ...DEFAULT_PREFERENCES };
  }
}
```

_Listing 5-5: User preferences storage with sensible defaults_

The merge pattern (`{ ...current, ...preferences }`) enables partial updates. You can call `saveUserPreferences({ hapticFeedback: false })` without losing other preferences.

---

## Step 2: Build the useSession Hook

```typescript
// features/session/hooks/use-session.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
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
  /** Auto-restore session on mount (default: true) */
  autoRestore?: boolean;
  /** Auto-sync with wallet connection state (default: true) */
  autoSync?: boolean;
  /** Session expiry in milliseconds (default: 24 hours) */
  sessionExpiryMs?: number;
  /** Expiry warning threshold in ms (default: 5 minutes) */
  expiryWarningMs?: number;
  /** Update activity on app foreground (default: true) */
  trackAppState?: boolean;
}

export interface UseSessionReturn {
  session: SessionData | null;
  preferences: UserPreferences;
  isRestoring: boolean;
  isValid: boolean;
  isExpiringSoon: boolean;
  timeRemaining: number;
  createNewSession: (walletAddress?: string) => Promise<SessionData | null>;
  endSession: (keepPreferences?: boolean) => Promise<void>;
  extendCurrentSession: (additionalMs?: number) => Promise<SessionData | null>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<boolean>;
  refresh: () => Promise<void>;
}
```

_Listing 5-6: useSession hook interface with options and return types_

The options interface makes the hook configurable. Default values (`autoRestore = true`, etc.) mean it works out-of-the-box while allowing customization.

---

Now let's implement the hook:

```typescript
// features/session/hooks/use-session.ts (continued)

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  showBalance: true,
  notifications: true,
  hapticFeedback: true,
};

export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    autoRestore = true,
    autoSync = true,
    sessionExpiryMs = 24 * 60 * 60 * 1000,
    expiryWarningMs = 5 * 60 * 1000,
    trackAppState = true,
  } = options;

  const { smartWalletPubkey, isConnected } = useWallet();

  const [session, setSession] = useState<SessionData | null>(null);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isRestoring, setIsRestoring] = useState(autoRestore);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const hasRestoredRef = useRef(false);
  const expiryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Refresh session state from storage
   */
  const refresh = useCallback(async () => {
    const [storedSession, storedPrefs, remaining, expiring] = await Promise.all(
      [
        getSession(),
        getUserPreferences(),
        getSessionTimeRemaining(),
        isSessionExpiringSoon(expiryWarningMs),
      ]
    );

    setSession(storedSession);
    setPreferences(storedPrefs);
    setTimeRemaining(remaining);
    setIsExpiringSoon(expiring);
  }, [expiryWarningMs]);

  // ... session methods
}
```

_Listing 5-7: useSession hook setup with state and refresh function_

We use `Promise.all` to fetch all session data in parallel, minimizing latency during restoration.

---

Now let's add the session methods:

```typescript
// features/session/hooks/use-session.ts (continued)

/**
 * Create a new session
 */
const createNewSession = useCallback(
  async (walletAddress?: string): Promise<SessionData | null> => {
    const address = walletAddress || smartWalletPubkey?.toBase58();

    if (!address) {
      console.warn("Cannot create session: No wallet address provided");
      return null;
    }

    const newSession = await createSession(address, {
      expiryMs: sessionExpiryMs,
    });

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
const endSession = useCallback(
  async (keepPreferences: boolean = true): Promise<void> => {
    await clearAllSessionData(keepPreferences);
    setSession(null);
    setTimeRemaining(0);
    setIsExpiringSoon(false);

    if (!keepPreferences) {
      setPreferences(DEFAULT_PREFERENCES);
    }
  },
  []
);

/**
 * Extend the current session
 */
const extendCurrentSession = useCallback(
  async (additionalMs?: number): Promise<SessionData | null> => {
    const extended = await extendSession(additionalMs || sessionExpiryMs);

    if (extended) {
      setSession(extended);
      const remaining = await getSessionTimeRemaining();
      setTimeRemaining(remaining);
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
  async (prefs: Partial<UserPreferences>): Promise<boolean> => {
    const success = await saveUserPreferences(prefs);

    if (success) {
      setPreferences((current) => ({ ...current, ...prefs }));
    }

    return success;
  },
  []
);
```

_Listing 5-8: Session management methods_

All methods update both AsyncStorage (via service functions) and React state—this ensures the UI immediately reflects changes.

---

Now let's add the automatic effects:

```typescript
// features/session/hooks/use-session.ts (continued)

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-RESTORE ON MOUNT
// ═══════════════════════════════════════════════════════════════════════════

useEffect(() => {
  if (autoRestore && !hasRestoredRef.current) {
    hasRestoredRef.current = true;

    const restoreSession = async () => {
      setIsRestoring(true);
      await refresh();
      setIsRestoring(false);
    };

    restoreSession();
  }
}, [autoRestore, refresh]);

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-SYNC WITH WALLET
// ═══════════════════════════════════════════════════════════════════════════

useEffect(() => {
  if (!autoSync) return;

  const syncWithWallet = async () => {
    if (isConnected && smartWalletPubkey) {
      const currentSession = await getSession();
      const walletAddress = smartWalletPubkey.toBase58();

      // Create session if none exists or wallet changed
      if (!currentSession || currentSession.walletAddress !== walletAddress) {
        await createNewSession(walletAddress);
      } else {
        await updateLastActivity();
        await refresh();
      }
    }
  };

  syncWithWallet();
}, [autoSync, isConnected, smartWalletPubkey, createNewSession, refresh]);
```

_Listing 5-9: Auto-restore and wallet sync effects_

The wallet sync effect creates a session when the wallet connects and handles wallet switching—if the user connects a different wallet, a new session is created.

---

Now let's add app state tracking (unique to mobile):

```typescript
// features/session/hooks/use-session.ts (continued)

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

useEffect(() => {
  if (!trackAppState || !session) return;

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // App came to foreground - update activity and check expiry
      const valid = await hasValidSession();
      if (valid) {
        await updateLastActivity();
        await refresh();
      } else {
        // Session expired while app was in background
        setSession(null);
        setTimeRemaining(0);
        setIsExpiringSoon(false);
      }
    }
  };

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange
  );

  return () => {
    subscription.remove();
  };
}, [trackAppState, session, refresh]);
```

_Listing 5-10: App state tracking for background/foreground transitions_

This is mobile-specific! When the app comes to the foreground (`nextAppState === "active"`), we:

1. Check if the session is still valid (it may have expired while in background)
2. Update the last activity timestamp
3. Refresh the session state

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// EXPIRY MONITORING
// ═══════════════════════════════════════════════════════════════════════════

useEffect(() => {
  if (!session) return;

  const checkExpiry = async () => {
    const remaining = await getSessionTimeRemaining();
    setTimeRemaining(remaining);

    const expiring = await isSessionExpiringSoon(expiryWarningMs);
    setIsExpiringSoon(expiring);

    // Session has expired
    if (remaining === 0) {
      setSession(null);
      await clearSession();
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
  isValid: session !== null,
  isExpiringSoon,
  timeRemaining,
  createNewSession,
  endSession,
  extendCurrentSession,
  updatePreferences,
  refresh,
};
```

_Listing 5-11: Expiry monitoring and hook return value_

---

## Step 3: Implementing Session Expiry Warnings

```tsx
// components/SessionExpiryWarning.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSession } from "@/hooks";

export function SessionExpiryWarning() {
  const { isExpiringSoon, timeRemaining, extendCurrentSession, endSession } =
    useSession();

  if (!isExpiringSoon) return null;

  const minutesLeft = Math.floor(timeRemaining / 60000);
  const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Expiring Soon</Text>
      <Text style={styles.time}>
        {minutesLeft}:{secondsLeft.toString().padStart(2, "0")}
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.extendButton}
          onPress={() => extendCurrentSession()}
        >
          <Text style={styles.extendText}>Stay Logged In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => endSession()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#FEF3C7",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#92400E" },
  time: { fontSize: 24, fontWeight: "bold", color: "#92400E", marginTop: 4 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 12 },
  extendButton: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
  },
  extendText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  logoutButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  logoutText: { color: "#000", textAlign: "center", fontWeight: "600" },
});
```

_Listing 5-12: Session expiry warning component_

---

## Step 4: Managing User Preferences

```tsx
// components/SettingsScreen.tsx
import React from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { useSession } from "@/hooks";

export function SettingsScreen() {
  const { preferences, updatePreferences } = useSession();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Show Balance</Text>
        <Switch
          value={preferences.showBalance}
          onValueChange={(value) => updatePreferences({ showBalance: value })}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch
          value={preferences.notifications}
          onValueChange={(value) => updatePreferences({ notifications: value })}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Haptic Feedback</Text>
        <Switch
          value={preferences.hapticFeedback}
          onValueChange={(value) =>
            updatePreferences({ hapticFeedback: value })
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 16 },
});
```

_Listing 5-13: Settings screen for managing user preferences_

---

## Step 5: Integrating with Your App

### Root Layout Integration

```tsx
// app/_layout.tsx
import "../polyfills";
import { Slot } from "expo-router";
import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

export default function RootLayout() {
  return (
    <LazorKitProvider cluster="devnet">
      <Slot />
      <SessionExpiryWarning />
    </LazorKitProvider>
  );
}
```

_Listing 5-14: Root layout with session warning overlay_

### Protected Screen Pattern

```tsx
// app/(tabs)/dashboard.tsx
import { View, Text, ActivityIndicator } from "react-native";
import { useSession } from "@/hooks";
import { Redirect } from "expo-router";

export default function DashboardScreen() {
  const { isRestoring, isValid, session } = useSession();

  // Show loading while restoring session
  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Restoring session...</Text>
      </View>
    );
  }

  // Redirect to welcome if no valid session
  if (!isValid) {
    return <Redirect href="/welcome" />;
  }

  // Render dashboard
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Welcome back!</Text>
      <Text style={{ color: "#666", marginTop: 8 }}>
        {session?.walletAddress.slice(0, 8)}...
      </Text>
    </View>
  );
}
```

_Listing 5-15: Protected dashboard screen with session checks_

### Logout Button

```tsx
// components/LogoutButton.tsx
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useSession } from "@/hooks";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { router } from "expo-router";

export function LogoutButton() {
  const { endSession } = useSession();
  const { disconnect } = useWallet();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await endSession(true); // Keep preferences
          await disconnect();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleLogout}>
      <Text style={styles.text}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: 12 },
  text: { color: "#EF4444", fontSize: 16 },
});
```

_Listing 5-16: Logout button with confirmation dialog_

---

## Complete Code Example

```tsx
// app/(tabs)/index.tsx - Complete integration example
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useSession } from "@/hooks";
import { Redirect, router } from "expo-router";
import { LogoutButton } from "@/components/LogoutButton";

export default function HomeScreen() {
  const { isConnected, connect, smartWalletPubkey } = useWallet();
  const {
    session,
    preferences,
    isRestoring,
    isValid,
    isExpiringSoon,
    timeRemaining,
    extendCurrentSession,
  } = useSession();

  // Loading state
  if (isRestoring) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Restoring session...</Text>
      </View>
    );
  }

  // Not authenticated - show connect option
  if (!isValid) {
    return (
      <View style={styles.centered}>
        <Text style={styles.welcomeIcon}>👋</Text>
        <Text style={styles.welcomeTitle}>Welcome to PassPay</Text>
        <Text style={styles.welcomeSubtitle}>
          Connect your wallet to get started
        </Text>
        <TouchableOpacity style={styles.connectButton} onPress={connect}>
          <Text style={styles.connectButtonText}>Connect with Passkey</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Authenticated - show dashboard
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.address}>
            {session?.walletAddress.slice(0, 8)}...
            {session?.walletAddress.slice(-6)}
          </Text>
        </View>
        <LogoutButton />
      </View>

      {/* Session status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Session Status</Text>
        <Text style={styles.statusValue}>
          {isExpiringSoon ? "⚠️ Expiring Soon" : "✅ Active"}
        </Text>
        <Text style={styles.statusTime}>
          Time remaining: {Math.floor(timeRemaining / 60000)} minutes
        </Text>
        {isExpiringSoon && (
          <TouchableOpacity
            style={styles.extendButton}
            onPress={() => extendCurrentSession()}
          >
            <Text style={styles.extendButtonText}>Extend Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Preferences summary */}
      <View style={styles.prefsCard}>
        <Text style={styles.prefsTitle}>Your Preferences</Text>
        <Text style={styles.prefItem}>
          Show Balance: {preferences.showBalance ? "Yes" : "No"}
        </Text>
        <Text style={styles.prefItem}>
          Haptic Feedback: {preferences.hapticFeedback ? "Enabled" : "Disabled"}
        </Text>
        <Text style={styles.prefItem}>
          Notifications: {preferences.notifications ? "On" : "Off"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  welcomeIcon: { fontSize: 64, marginBottom: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
  connectButton: {
    backgroundColor: "#000",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  connectButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 24, fontWeight: "bold" },
  address: { fontSize: 14, color: "#666", marginTop: 4 },
  statusCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusLabel: { fontSize: 14, color: "#666" },
  statusValue: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  statusTime: { fontSize: 14, color: "#666", marginTop: 4 },
  extendButton: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  extendButtonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  prefsCard: { backgroundColor: "#f5f5f5", padding: 16, borderRadius: 12 },
  prefsTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  prefItem: { fontSize: 14, color: "#666", marginBottom: 4 },
});
```

_Listing 5-17: Complete home screen with session integration_

---

## Production Considerations

### Security Best Practices

1. **Session Validation**: Consider validating sessions with a backend for critical operations
2. **Sensitive Data**: Never store private keys or sensitive data in AsyncStorage
3. **Session Fingerprinting**: Add device fingerprinting for session hijacking detection

### Performance

```typescript
// Batch AsyncStorage operations
import AsyncStorage from "@react-native-async-storage/async-storage";

// Instead of multiple setItem calls:
await AsyncStorage.multiSet([
  ["passpay_session", JSON.stringify(session)],
  ["passpay_preferences", JSON.stringify(preferences)],
]);
```

_Listing 5-18: Batch storage operations for better performance_

### Biometric Lock (Advanced)

```typescript
import * as LocalAuthentication from "expo-local-authentication";

async function requireBiometricToExtend(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to extend session",
  });
  return result.success;
}
```

_Listing 5-19: Optional biometric authentication for session extension_

---

## Testing Your Implementation

```typescript
// __tests__/session.service.test.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createSession,
  getSession,
  clearSession,
  hasValidSession,
  extendSession,
} from "@/features/session/services";

describe("Session Service", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("creates a session", async () => {
    const session = await createSession("test-wallet-address");
    expect(session).not.toBeNull();
    expect(session?.walletAddress).toBe("test-wallet-address");
    expect(session?.isAuthenticated).toBe(true);
  });

  it("retrieves a valid session", async () => {
    await createSession("test-wallet");
    const session = await getSession();
    expect(session).not.toBeNull();
    expect(await hasValidSession()).toBe(true);
  });

  it("clears a session", async () => {
    await createSession("test-wallet");
    await clearSession();
    expect(await getSession()).toBeNull();
    expect(await hasValidSession()).toBe(false);
  });

  it("detects expired sessions", async () => {
    await createSession("test-wallet", { expiryMs: -1000 }); // Already expired
    expect(await getSession()).toBeNull();
  });

  it("extends session duration", async () => {
    const session = await createSession("test-wallet", { expiryMs: 1000 });
    const extended = await extendSession(60000);
    expect(extended?.expiresAt).toBeGreaterThan(session!.expiresAt);
  });
});
```

_Listing 5-20: Unit tests for session service functions_

---

## 🎉 Summary

You've learned how to:

- ✅ Implement session persistence with AsyncStorage
- ✅ Create and manage user sessions
- ✅ Track user activity and session expiry
- ✅ Handle app background/foreground transitions
- ✅ Show session expiry warnings
- ✅ Persist user preferences across sessions
- ✅ Integrate session management with your app

### Key Differences from Web

| Aspect            | Web (localStorage)  | Mobile (AsyncStorage)      |
| ----------------- | ------------------- | -------------------------- |
| **API**           | Synchronous         | Asynchronous (Promises)    |
| **App State**     | Page visibility API | AppState API               |
| **Background**    | Tab switching       | Full background/foreground |
| **Biometrics**    | WebAuthn            | LocalAuthentication        |
| **Storage Limit** | ~5MB                | Unlimited (device storage) |

---

## Complete Example

See the full implementation on PassPay in session-related hooks.

```
📁 Key Files
├── features/session/
│   ├── hooks/
│   │   └── use-session-wallet.ts            ← Session management hook
│   └── services/
│       └── session.service.ts               ← Session key helpers
├── hooks/
│   └── use-lazorkit-transaction.ts          ← Transaction hook
└── services/
    └── rpc.ts                               ← Connection setup
```

---

## Next Steps

- Explore [Tutorial 1: Passkey Wallet](./01-PASSKEY_WALLET.md) for wallet creation
- Learn about [Gasless Transactions](./02-GASLESS_TRANSACTIONS.md)
- Build [On-Chain Memos](./04-ON_CHAIN_MEMOS.md) with permanent storage

---

## 📚 Related Documentation

- [API Reference](../API_REFERENCE.md) - Complete hook and service documentation
- [Architecture Overview](../ARCHITECTURE.md) - How PassPay Mobile is structured
- [Troubleshooting](../TROUBLESHOOTING.md) - Common issues and solutions
