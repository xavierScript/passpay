/**
 * Hooks Index
 *
 * Re-export all custom hooks for convenient imports.
 * Hooks are now organized by feature but re-exported here for convenience.
 *
 * @example
 * ```tsx
 * import { useSolBalance, useTransfer, useStaking } from '@/hooks';
 * ```
 */

// Wallet feature hooks
export { useSolBalance, useTransaction } from "@/feature-examples/wallet/hooks";

// Transfer feature hooks
export { useTransfer } from "@/feature-examples/transfer/hooks";

// Staking feature hooks
export { useStaking } from "@/feature-examples/staking/hooks";

// Memo feature hooks
export { useMemoHook } from "@/feature-examples/memo/hooks";

// Subscription feature hooks
export { useSubscription } from "@/feature-examples/subscription/hooks";

// Session feature hooks
export { useSession } from "@/feature-examples/session/hooks";
