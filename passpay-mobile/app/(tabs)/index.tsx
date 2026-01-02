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
import { clearCache, getSolBalance } from "@/services/rpc";
import { homeStyles as styles } from "@/styles";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const {
    connect,
    isConnected,
    smartWalletPubkey,
    disconnect,
    isConnecting,
    signMessage,
  } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<{
    signature: string;
    signedPayload: string;
  } | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Balance state - just SOL to avoid expensive RPC calls
  const [solBalance, setSolBalance] = useState(0);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch SOL balance only (stake accounts are too expensive for public RPC)
  const fetchBalances = useCallback(async () => {
    if (!smartWalletPubkey) return;

    try {
      const balance = await getSolBalance(smartWalletPubkey);
      setSolBalance(balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [smartWalletPubkey]);

  // Fetch balances only when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (isConnected && smartWalletPubkey) {
        setBalancesLoading(true);
        fetchBalances().finally(() => setBalancesLoading(false));
      } else {
        setSolBalance(0);
      }
    }, [isConnected, smartWalletPubkey])
  );

  // Pull to refresh - clears cache
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearCache();
    await fetchBalances();
    setRefreshing(false);
  }, [fetchBalances]);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Signing Messages with Passkey
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * The `signMessage()` function allows signing arbitrary messages:
   *
   * - Opens LazorKit portal for biometric authentication
   * - Returns a cryptographic signature of the message
   * - Useful for: login verification, off-chain attestations, proving ownership
   *
   * The returned signature can be verified on-chain or off-chain using
   * the wallet's public key.
   */
  const handleSignMessage = async () => {
    setSignature(null);
    setSignError(null);
    setSigning(true);
    try {
      const sig = await signMessage("Welcome to PassPay!", {
        redirectUrl: getRedirectUrl(),
      });
      console.log("Verified Signature:", sig); // Log as per docs
      setSignature(sig);
    } catch (e: any) {
      console.error("Sign error:", e);
      setSignError(e?.message || "Failed to sign message");
    } finally {
      setSigning(false);
    }
  };

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
          setSignature(null); // Clear signature on disconnect
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

  const handleCopyAddress = async () => {
    try {
      const address = smartWalletPubkey?.toBase58();
      if (!address) return;
      await Clipboard.setStringAsync(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      console.error("Copy failed:", e);
      Alert.alert("Copy Failed", e?.message || "Failed to copy address");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        isConnected ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        ) : undefined
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>PassPay</Text>
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

              {/* SOL Balance */}
              <View style={styles.mainBalanceRow}>
                <Text style={styles.mainBalanceValue}>
                  {solBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </Text>
                <Text style={styles.mainBalanceSymbol}>SOL</Text>
              </View>

              <Text style={styles.refreshHint}>
                Pull down to refresh • View staked SOL in Stake tab
              </Text>
            </View>

            {/* Sign Message Button - Commented out as it's a demo/testing feature
            <TouchableOpacity
              style={[styles.button, signing && styles.buttonDisabled]}
              onPress={handleSignMessage}
              disabled={signing}
            >
              {signing ? (
                <ActivityIndicator color={AppColors.background} />
              ) : (
                <Text style={styles.buttonText}>Sign Message</Text>
              )}
            </TouchableOpacity>
            */}

            {/* Display Signature */}
            {/* {signature && (
              <View style={styles.signatureCard}>
                <Text style={styles.label}>Verified Signature</Text>
                <Text
                  style={styles.signatureText}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {signature.signature}
                </Text>
                <Text style={styles.label}>Signed Payload</Text>
                <Text
                  style={styles.payloadText}
                  numberOfLines={2}
                  ellipsizeMode="middle"
                >
                  {signature.signedPayload}
                </Text>
              </View>
            )} */}

            {/* Display Error */}
            {signError && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>❌ {signError}</Text>
              </View>
            )}

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
