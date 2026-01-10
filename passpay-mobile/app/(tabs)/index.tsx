/**
 * Home Screen - Wallet Connection & Overview
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Creating a Passkey-Based Wallet with LazorKit
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This screen demonstrates the core LazorKit integration for:
 * 1. Creating/connecting a passkey-based smart wallet
 * 2. Displaying wallet information and SOL balance
 * 3. Signing messages with biometric authentication
 *
 * WHAT IS A PASSKEY WALLET?
 * -------------------------
 * Unlike traditional wallets that use seed phrases, LazorKit creates
 * wallets secured by your device's biometrics (FaceID/TouchID/Fingerprint).
 * The private key never leaves your device's secure enclave.
 *
 * KEY CONCEPTS:
 * - `connect()`: Opens LazorKit portal for passkey authentication
 * - `smartWalletPubkey`: Your on-chain wallet address (PublicKey)
 * - `signMessage()`: Signs arbitrary messages with your passkey
 * - `redirectUrl`: Deep link back to your app after portal interaction
 *
 * FLOW:
 * 1. User taps "Connect with Passkey"
 * 2. LazorKit portal opens in browser
 * 3. User authenticates with biometrics
 * 4. Portal redirects back with wallet info
 * 5. App receives `smartWalletPubkey` via the adapter
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { AppColors } from "@/constants/theme";
import { useClipboard, useSolBalance } from "@/hooks";
import { homeStyles as styles } from "@/styles";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Logo } from "@/components";

export default function HomeScreen() {
  const { connect, isConnected, smartWalletPubkey, disconnect, isConnecting } =
    useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // ✨ Using custom hooks for cleaner code
  const { copy, copied } = useClipboard();
  const {
    loading: balancesLoading,
    refreshControl,
    formattedBalance,
  } = useSolBalance();

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Connecting a Passkey Wallet
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * The `connect()` function from useWallet() initiates the passkey flow:
   *
   * 1. Opens LazorKit's web portal in the device browser
   * 2. User creates or selects an existing passkey
   * 3. Biometric authentication (FaceID/TouchID) is performed
   * 4. Portal redirects back to app via `redirectUrl` deep link
   * 5. `onSuccess` callback receives the wallet object
   *
   * The `redirectUrl` must match your app's URL scheme configured in app.json:
   * ```json
   * "scheme": "passpaymobile"
   * ```
   *
   * After connection, `smartWalletPubkey` contains your on-chain address.
   */
  const handleConnect = async () => {
    if (isConnecting || isLoading) return;

    try {
      setIsLoading(true);
      await connect({
        redirectUrl: getRedirectUrl(),
        onSuccess: (wallet) => {
          console.log("Connected successfully:", wallet.smartWallet);
          setIsLoading(false);
        },
        onFail: (error) => {
          console.error("Connection failed:", error);
          Alert.alert("Connection Failed", error?.message || "Unknown error");
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      console.error("Error connecting:", error);
      Alert.alert("Error", error?.message || "Failed to connect");
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({
        onSuccess: () => {
          console.log("Disconnected");
        },
        onFail: (error) => {
          console.error("Disconnect failed:", error);
          Alert.alert("Error", "Failed to disconnect");
        },
      });
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      Alert.alert("Error", error?.message || "Failed to disconnect");
    }
  };

  // ✨ Using useClipboard hook - much simpler!
  const handleCopyAddress = () => {
    const address = smartWalletPubkey?.toBase58();
    if (address) {
      copy(address);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={refreshControl}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={48} showText />
        </View>
        <Text style={styles.subtitle}>Passkey-Powered Solana Wallet</Text>

        {isConnected && smartWalletPubkey ? (
          <View style={styles.walletContainer}>
            {/* Wallet Info Card */}
            <View style={styles.walletCard}>
              <Text style={styles.label}>Wallet Address</Text>
              <TouchableOpacity onPress={handleCopyAddress} activeOpacity={0.7}>
                <Text
                  style={styles.address}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {smartWalletPubkey.toBase58()}
                </Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>
                {copied ? "✓ Copied to clipboard" : "✓ Connected with Passkey"}
              </Text>
            </View>

            {/* SOL Balance Card */}
            <View style={styles.balancesCard}>
              <View style={styles.balancesHeader}>
                <Text style={styles.balancesTitle}>💰 Balance</Text>
                {balancesLoading && (
                  <ActivityIndicator size="small" color={AppColors.primary} />
                )}
              </View>

              {/* SOL Balance - using formattedBalance from hook */}
              <View style={styles.mainBalanceRow}>
                <Text style={styles.mainBalanceValue}>{formattedBalance}</Text>
                <Text style={styles.mainBalanceSymbol}>SOL</Text>
              </View>

              <Text style={styles.refreshHint}>
                Pull down to refresh • View staked SOL in Stake tab
              </Text>
            </View>

            {/* Disconnect Button */}
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleDisconnect}
            >
              <Text style={[styles.buttonText, styles.buttonSecondaryText]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.connectContainer}>
            <Text style={styles.description}>
              Create or connect your wallet using biometric authentication
              (FaceID, TouchID, or fingerprint)
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                (isConnecting || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleConnect}
              disabled={isConnecting || isLoading}
            >
              {isConnecting || isLoading ? (
                <ActivityIndicator color={AppColors.background} />
              ) : (
                <Text style={styles.buttonText}>Connect with Passkey</Text>
              )}
            </TouchableOpacity>

            <View style={styles.features}>
              <FeatureItem text="🔐 Biometric Security" />
              <FeatureItem text="⚡ Gasless Transactions" />
              <FeatureItem text="🥩 SOL Staking" />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}
