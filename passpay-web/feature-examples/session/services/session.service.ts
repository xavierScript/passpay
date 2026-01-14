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
 * Session service configuration options
 */
export interface SessionConfig {
  /** Session expiry time in milliseconds */
  expiryMs?: number;
  /** Storage prefix for keys */
  prefix?: string;
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

/**
 * Create a new session
 *
 * @param walletAddress - The wallet public key
 * @param config - Optional session configuration
 * @returns The created session data or null if failed
 *
 * @example
 * ```ts
 * const session = createSession("5nTuNh...");
 * if (session) {
 *   console.log("Session created:", session.walletAddress);
 * }
 * ```
 */
export function createSession(
  walletAddress: string,
  config: SessionConfig = {}
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
 *
 * @returns The session data or null if no valid session exists
 *
 * @example
 * ```ts
 * const session = getSession();
 * if (session) {
 *   console.log("Active session for:", session.walletAddress);
 * }
 * ```
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
 *
 * @returns True if a valid session exists
 *
 * @example
 * ```ts
 * if (hasValidSession()) {
 *   // User is authenticated
 * }
 * ```
 */
export function hasValidSession(): boolean {
  const session = getSession();
  return session !== null && session.isAuthenticated;
}

/**
 * Update the last activity timestamp
 *
 * @returns True if update was successful
 *
 * @example
 * ```ts
 * // Call on user interaction
 * updateLastActivity();
 * ```
 */
export function updateLastActivity(): boolean {
  const session = getSession();

  if (!session) return false;

  session.lastActivity = Date.now();
  return safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Extend the session expiry
 *
 * @param additionalMs - Additional time in milliseconds (defaults to original expiry duration)
 * @returns The updated session or null if failed
 *
 * @example
 * ```ts
 * // Extend session by another 24 hours
 * const updated = extendSession(24 * 60 * 60 * 1000);
 * ```
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
 * Clear the current session
 *
 * @returns True if session was cleared
 *
 * @example
 * ```ts
 * clearSession();
 * console.log("User logged out");
 * ```
 */
export function clearSession(): boolean {
  return safeRemoveItem(STORAGE_KEYS.SESSION);
}

/**
 * Get session time remaining in milliseconds
 *
 * @returns Time remaining in ms, or 0 if no session
 *
 * @example
 * ```ts
 * const remaining = getSessionTimeRemaining();
 * if (remaining < 60000) {
 *   console.log("Session expiring soon!");
 * }
 * ```
 */
export function getSessionTimeRemaining(): number {
  const session = getSession();
  if (!session) return 0;

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Save user preferences
 *
 * @param preferences - User preferences to save
 * @returns True if save was successful
 *
 * @example
 * ```ts
 * saveUserPreferences({
 *   theme: 'dark',
 *   showBalance: true,
 * });
 * ```
 */
export function saveUserPreferences(preferences: UserPreferences): boolean {
  const current = getUserPreferences();
  const merged = { ...current, ...preferences };
  return safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(merged));
}

/**
 * Get user preferences
 *
 * @returns User preferences or default values
 *
 * @example
 * ```ts
 * const prefs = getUserPreferences();
 * console.log("Theme:", prefs.theme);
 * ```
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

/**
 * Clear all session-related data (full logout)
 *
 * @param keepPreferences - Whether to keep user preferences
 * @returns True if all data was cleared
 *
 * @example
 * ```ts
 * // Full logout but keep preferences
 * clearAllSessionData(true);
 *
 * // Complete reset
 * clearAllSessionData(false);
 * ```
 */
export function clearAllSessionData(keepPreferences: boolean = true): boolean {
  const sessionCleared = clearSession();
  const activityCleared = safeRemoveItem(STORAGE_KEYS.LAST_ACTIVITY);

  if (!keepPreferences) {
    safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  return sessionCleared && activityCleared;
}

/**
 * Check if session is about to expire (within threshold)
 *
 * @param thresholdMs - Warning threshold in milliseconds (default: 5 minutes)
 * @returns True if session is expiring soon
 *
 * @example
 * ```ts
 * if (isSessionExpiringSoon()) {
 *   showExpiryWarning();
 * }
 * ```
 */
export function isSessionExpiringSoon(
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  const remaining = getSessionTimeRemaining();
  return remaining > 0 && remaining <= thresholdMs;
}
