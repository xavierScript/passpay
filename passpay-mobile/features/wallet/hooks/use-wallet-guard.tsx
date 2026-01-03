/**
 * useWalletGuard Hook
 *
 * A hook that provides wallet connection state with:
 * - Easy connection status check
 * - "Not connected" UI rendering helper
 * - Wallet address utilities
 *
 * @example
 * ```tsx
 * const { isConnected, address, truncatedAddress, NotConnectedView } = useWalletGuard({
 *   icon: '💸',
 *   message: 'Connect wallet to send SOL',
 * });
 *
 * if (!isConnected) {
 *   return <NotConnectedView />;
 * }
 *
 * // Render connected UI...
 * ```
 */

import { AppColors } from "@/constants/theme";
import { truncateAddress } from "@/utils/helpers";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface UseWalletGuardOptions {
  /** Icon to show in not-connected state */
  icon?: string;
  /** Message to show in not-connected state */
  message?: string;
  /** Submessage to show in not-connected state */
  subMessage?: string;
}

export interface UseWalletGuardReturn {
  /** Whether the wallet is connected */
  isConnected: boolean;
  /** Full wallet address (base58) or null */
  address: string | null;
  /** Truncated address for display */
  truncatedAddress: string;
  /** The wallet public key */
  publicKey: ReturnType<typeof useWallet>["smartWalletPubkey"];
  /** Pre-built "not connected" view component */
  NotConnectedView: React.FC;
}

export function useWalletGuard(
  options: UseWalletGuardOptions = {}
): UseWalletGuardReturn {
  const {
    icon = "🔐",
    message = "Connect your wallet to continue",
    subMessage = "Go to the Wallet tab to connect",
  } = options;

  const { isConnected, smartWalletPubkey } = useWallet();

  const address = smartWalletPubkey?.toBase58() ?? null;
  const truncated = address ? truncateAddress(address, 6, 6) : "";

  // Pre-built component for not-connected state
  const NotConnectedView: React.FC = () => (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>{subMessage}</Text>
      </View>
    </View>
  );

  return {
    isConnected,
    address,
    truncatedAddress: truncated,
    publicKey: smartWalletPubkey,
    NotConnectedView,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
  },
});
