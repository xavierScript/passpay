/**
 * Session Service
 *
 * Manages user session persistence using AsyncStorage.
 * Provides utilities for storing, retrieving, and clearing session data.
 *
 * @example
 * ```typescript
 * import {
 *   createSession,
 *   getSession,
 *   clearSession,
 *   hasValidSession,
 * } from '@/features/session/services';
 *
 * // Create a session after wallet connection
 * const session = await createSession(walletAddress);
 *
 * // Check if user has valid session
 * const isValid = await hasValidSession();
 *
 * // Clear session on logout
 * await clearSession();
 * ```
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
  /** Default transfer amount */
  defaultTransferAmount?: string;
  /** Notification preferences */
  notifications?: boolean;
  /** Haptic feedback enabled */
  hapticFeedback?: boolean;
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  showBalance: true,
  notifications: true,
  hapticFeedback: true,
};

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

// ═══════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new session
 * @param walletAddress - The wallet public key
 * @param config - Optional session configuration
 * @returns The created session data or null if failed
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
 * @returns The session data or null if no valid session
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
 * @returns True if there's a valid authenticated session
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.isAuthenticated;
}

/**
 * Update the last activity timestamp
 * @returns True if successful
 */
export async function updateLastActivity(): Promise<boolean> {
  const session = await getSession();

  if (!session) return false;

  session.lastActivity = Date.now();
  return await safeSetItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clear the current session
 * @returns True if successful
 */
export async function clearSession(): Promise<boolean> {
  return await safeRemoveItem(STORAGE_KEYS.SESSION);
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION EXPIRY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extend the session expiry
 * @param additionalMs - Milliseconds to add to current time (default 24 hours)
 * @returns The extended session data or null if failed
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
 * @returns Milliseconds until session expires (0 if expired/no session)
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;

  const remaining = session.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Check if session is about to expire (within threshold)
 * @param thresholdMs - Warning threshold in ms (default 5 minutes)
 * @returns True if session expires within threshold
 */
export async function isSessionExpiringSoon(
  thresholdMs: number = 5 * 60 * 1000
): Promise<boolean> {
  const remaining = await getSessionTimeRemaining();
  return remaining > 0 && remaining <= thresholdMs;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PREFERENCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save user preferences
 * @param preferences - Partial preferences to merge
 * @returns True if successful
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
 * @returns User preferences with defaults applied
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

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clear all session-related data (full logout)
 * @param keepPreferences - Whether to keep user preferences
 * @returns True if successful
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
