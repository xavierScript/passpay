/**
 * Session Services
 *
 * Central export point for session management services.
 */

export {
  // Types
  type SessionData,
  type UserPreferences,
  // Session management
  createSession,
  getSession,
  clearSession,
  hasValidSession,
  updateLastActivity,
  // Expiry management
  extendSession,
  getSessionTimeRemaining,
  isSessionExpiringSoon,
  // User preferences
  saveUserPreferences,
  getUserPreferences,
  // Cleanup
  clearAllSessionData,
} from "./session.service";
