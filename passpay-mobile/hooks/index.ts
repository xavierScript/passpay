/**
 * Custom Hooks for PassPay
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REUSABLE HOOKS LIBRARY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module exports a collection of custom React hooks designed for
 * LazorKit + Solana mobile app development. These hooks abstract common
 * patterns and reduce boilerplate across your screens.
 *
 * AVAILABLE HOOKS:
 *
 * 📊 useSolBalance
 *    - Auto-fetching SOL balance on screen focus
 *    - Built-in pull-to-refresh support
 *    - Caching and loading states
 *
 * 🔄 useLazorkitTransaction
 *    - Unified transaction handling
 *    - Automatic loading/error states
 *    - Gasless transaction support
 *    - Success/error callbacks
 *
 * 📋 useClipboard
 *    - Copy to clipboard with feedback
 *    - Auto-reset "copied" state
 *    - Error handling
 *
 * 📜 useTransactionHistory
 *    - In-memory transaction log
 *    - Explorer URL generation
 *    - Automatic timestamps
 *
 * 🔐 useWalletGuard
 *    - Wallet connection status
 *    - "Not connected" UI helper
 *    - Address formatting utilities
 *
 * 🎨 useColorScheme
 *    - System theme detection
 *    - Light/dark mode support
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @example
 * ```tsx
 * import {
 *   useSolBalance,
 *   useLazorkitTransaction,
 *   useClipboard,
 *   useTransactionHistory,
 *   useWalletGuard,
 * } from '@/hooks';
 *
 * function MyScreen() {
 *   const { isConnected, NotConnectedView } = useWalletGuard({ icon: '💰' });
 *   const { balance, refreshControl } = useSolBalance();
 *   const { execute, loading } = useLazorkitTransaction({ gasless: true });
 *   const { copy, copied } = useClipboard();
 *   const { history, addTransaction } = useTransactionHistory();
 *
 *   if (!isConnected) return <NotConnectedView />;
 *
 *   // ... rest of your component
 * }
 * ```
 */

// Transaction Hooks
export {
  useLazorkitTransaction,
  type ClusterType,
  type FeeTokenType,
  type TransactionOptions,
  type UseLazorkitTransactionOptions,
  type UseLazorkitTransactionReturn,
} from "./use-lazorkit-transaction";

// Utility Hooks
export {
  useClipboard,
  type UseClipboardOptions,
  type UseClipboardReturn,
} from "./use-clipboard";

export {
  useTransactionHistory,
  type HistoryItem,
  type UseTransactionHistoryOptions,
  type UseTransactionHistoryReturn,
} from "./use-transaction-history";

// Wallet Hooks (from wallet feature)
export {
  useWalletGuard,
  type UseWalletGuardOptions,
  type UseWalletGuardReturn,
} from "@/features/wallet/hooks/use-wallet-guard";

export {
  useSolBalance,
  type UseSolBalanceOptions,
  type UseSolBalanceReturn,
} from "@/features/wallet/hooks/use-sol-balance";

// Theme Hooks
export { useColorScheme } from "./use-color-scheme";
