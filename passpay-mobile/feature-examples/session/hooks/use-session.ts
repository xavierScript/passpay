/**
 * useSession Hook
 *
 * Custom hook for managing user session persistence.
 * Integrates with LazorKit wallet and provides automatic session handling.
 *
 * @example
 * ```tsx
 * import { useSession } from '@/hooks';
 *
 * function App() {
 *   const {
 *     session,
 *     isValid,
 *     isRestoring,
 *     isExpiringSoon,
 *     timeRemaining,
 *     preferences,
 *     createNewSession,
 *     endSession,
 *     extendCurrentSession,
 *     updatePreferences,
 *   } = useSession();
 *
 *   if (isRestoring) return <LoadingScreen />;
 *   if (!isValid) return <WelcomeScreen />;
 *
 *   return <Dashboard />;
 * }
 * ```
 */

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
  /** Current session data */
  session: SessionData | null;
  /** User preferences */
  preferences: UserPreferences;
  /** Whether session is being restored */
  isRestoring: boolean;
  /** Whether there's a valid session */
  isValid: boolean;
  /** Whether session is about to expire */
  isExpiringSoon: boolean;
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Create a new session */
  createNewSession: (walletAddress?: string) => Promise<SessionData | null>;
  /** End the current session */
  endSession: (keepPreferences?: boolean) => Promise<void>;
  /** Extend the current session */
  extendCurrentSession: (additionalMs?: number) => Promise<SessionData | null>;
  /** Update user preferences */
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<boolean>;
  /** Refresh session state from storage */
  refresh: () => Promise<void>;
}

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
  const expiryCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

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
          // Update activity for existing session
          await updateLastActivity();
          await refresh();
        }
      }
    };

    syncWithWallet();
  }, [autoSync, isConnected, smartWalletPubkey, createNewSession, refresh]);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN VALUE
  // ═══════════════════════════════════════════════════════════════════════════

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
}
