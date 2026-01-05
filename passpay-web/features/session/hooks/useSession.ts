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

/**
 * Session hook configuration options
 */
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

/**
 * Session hook return type
 */
export interface UseSessionReturn {
  /** Current session data */
  session: SessionData | null;
  /** User preferences */
  preferences: UserPreferences;
  /** Whether session is being restored */
  isRestoring: boolean;
  /** Whether session is valid */
  isValid: boolean;
  /** Whether session is expiring soon */
  isExpiringSoon: boolean;
  /** Time remaining in session (ms) */
  timeRemaining: number;
  /** Create a new session */
  createNewSession: (walletAddress?: string) => SessionData | null;
  /** End the current session */
  endSession: (keepPreferences?: boolean) => void;
  /** Extend the session */
  extendCurrentSession: (additionalMs?: number) => SessionData | null;
  /** Update user preferences */
  updatePreferences: (prefs: Partial<UserPreferences>) => boolean;
  /** Manually refresh session state */
  refresh: () => void;
}

/**
 * Hook for managing user session persistence
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     session,
 *     isValid,
 *     isExpiringSoon,
 *     createNewSession,
 *     endSession,
 *     preferences,
 *     updatePreferences,
 *   } = useSession();
 *
 *   // Auto-create session when wallet connects
 *   // Session persists across page refreshes
 *
 *   if (isExpiringSoon) {
 *     return <SessionExpiryWarning onExtend={extendCurrentSession} />;
 *   }
 *
 *   return (
 *     <div>
 *       {isValid ? (
 *         <Dashboard session={session} />
 *       ) : (
 *         <LoginPage />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
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
    } else if (!isConnected && session) {
      // Optionally clear session on disconnect
      // Uncomment if you want sessions to end when wallet disconnects:
      // endSession(true);
    }
  }, [
    autoSync,
    isConnected,
    smartWalletPubkey,
    session,
    createNewSession,
    refresh,
  ]);

  /**
   * Track activity and update last activity timestamp
   */
  useEffect(() => {
    if (!session) return;

    // Update activity on user interactions
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
}
