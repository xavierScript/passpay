/**
 * Components Index
 *
 * Re-export all components for convenient imports.
 *
 * @example
 * ```tsx
 * import { WalletConnect, MobileNav, PasskeySetup } from '@/components';
 * import { PageHeader, BalanceCard } from '@/components/dashboard';
 * import { Button, Card } from '@/components/ui';
 * ```
 */

// Shared components
export { WalletConnect } from "./WalletConnect";
export { MobileNav } from "./MobileNav";
export { PasskeySetup } from "./PasskeySetup";
export { SubscriptionGate } from "./SubscriptionGate";

// Re-export dashboard components
export * from "./dashboard";
