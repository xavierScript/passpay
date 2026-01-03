/**
 * Client-Side Subscription Manager (localStorage)
 *
 * WARNING: This is for DEMO purposes only!
 * - Data stored in localStorage can be easily modified by users
 * - Not suitable for production use
 * - Use a backend database for real applications
 */

export interface Subscription {
  wallet: string;
  plan: string;
  amount: number;
  signature: string;
  subscribedAt: string;
  expiresAt: string;
}

const STORAGE_KEY = "passpay_subscriptions";
const SUBSCRIPTION_DURATION_DAYS = 30;

/**
 * Save a new subscription to localStorage
 */
export function saveSubscription(
  wallet: string,
  plan: string,
  amount: number,
  signature: string
): Subscription {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DURATION_DAYS);

  const subscription: Subscription = {
    wallet,
    plan,
    amount,
    signature,
    subscribedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Store subscription indexed by wallet address
  const subscriptions = getAllSubscriptions();
  subscriptions[wallet] = subscription;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }

  return subscription;
}

/**
 * Get subscription for a specific wallet
 */
export function getSubscription(wallet: string): Subscription | null {
  const subscriptions = getAllSubscriptions();
  return subscriptions[wallet] || null;
}

/**
 * Check if a wallet has an active subscription
 */
export function hasActiveSubscription(wallet: string): boolean {
  const subscription = getSubscription(wallet);

  if (!subscription) return false;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);

  return now < expiresAt;
}

/**
 * Get active subscription for a wallet (returns null if expired)
 */
export function getActiveSubscription(wallet: string): Subscription | null {
  const subscription = getSubscription(wallet);

  if (!subscription) return null;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);

  return now < expiresAt ? subscription : null;
}

/**
 * Get all subscriptions from localStorage
 */
function getAllSubscriptions(): Record<string, Subscription> {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Clear all subscriptions (for testing)
 */
export function clearAllSubscriptions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get days remaining in subscription
 */
export function getDaysRemaining(wallet: string): number {
  const subscription = getActiveSubscription(wallet);

  if (!subscription) return 0;

  const now = new Date();
  const expiresAt = new Date(subscription.expiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
