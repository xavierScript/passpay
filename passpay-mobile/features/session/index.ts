/**
 * Session Feature
 *
 * Manages user session persistence using AsyncStorage.
 * Provides hooks and services for session management.
 *
 * @example
 * ```tsx
 * import { useSession } from '@/features/session';
 *
 * function App() {
 *   const { session, isValid, isRestoring } = useSession();
 *
 *   if (isRestoring) return <LoadingScreen />;
 *   if (!isValid) return <WelcomeScreen />;
 *
 *   return <Dashboard />;
 * }
 * ```
 */

// Hooks
export {
  useSession,
  type UseSessionOptions,
  type UseSessionReturn,
} from "./hooks";

// Services
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
} from "./services";
