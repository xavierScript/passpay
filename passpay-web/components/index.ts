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

// Shared components from common/
export { Logo } from "./common/Logo";
export { WalletConnect } from "./common/WalletConnect";
export { MobileNav } from "./common/MobileNav";
export { PasskeySetup } from "./common/PasskeySetup";
export { SubscriptionGate } from "./SubscriptionGate";

// Re-export dashboard components
export * from "./dashboard";
