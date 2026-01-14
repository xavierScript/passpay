/**
 * Styles Index - Export shared and global styles
 *
 * Feature-specific styles have been moved to their respective feature folders:
 * - homeStyles -> @/features/wallet/styles/home.styles
 * - transferStyles -> @/features/transfer/styles/transfer.styles
 * - stakeStyles -> @/features/staking/styles/stake.styles
 * - memoStyles -> @/features/memo/styles/memo.styles
 */

export { sharedStyles } from "./shared.styles";
export { welcomeStyles } from "./welcome.styles";

// Re-export feature styles for backward compatibility
export { homeStyles } from "@/feature-examples/wallet/styles/home.styles";
export { transferStyles } from "@/feature-examples/transfer/styles/transfer.styles";
export { stakeStyles } from "@/feature-examples/staking/styles/stake.styles";
export { memoStyles } from "@/feature-examples/memo/styles/memo.styles";
