/**
 * Home Screen - Wallet connection and overview
 *
 * The main entry point for PassPay. Handles passkey-based wallet
 * connection, displays SOL balance, and provides message signing.
 */

import { AppColors } from "@/constants/theme";
import { clearCache, getSolBalance } from "@/services/rpc";
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
  StyleSheet,
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

            {/* Sign Message Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: AppColors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray,
    textAlign: "center",
    marginBottom: 48,
  },
  connectContainer: {
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  walletContainer: {
    width: "100%",
  },
  walletCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balancesCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balancesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balancesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
  },
  mainBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    paddingVertical: 20,
  },
  mainBalanceValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  mainBalanceSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.text,
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tokenInfo: {
    flexDirection: "column",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  tokenName: {
    fontSize: 12,
    color: AppColors.gray,
    marginTop: 2,
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
  stakedBalance: {
    color: AppColors.warning,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.background,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
  },
  noBalancesText: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
    paddingVertical: 16,
  },
  refreshHint: {
    fontSize: 11,
    color: AppColors.gray,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "500",
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.gray,
    marginTop: 12,
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: AppColors.text,
  },
  signatureCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
  },
  signatureText: {
    fontSize: 12,
    color: AppColors.text,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  payloadText: {
    fontSize: 12,
    color: AppColors.gray,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: "#2A1A1A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
  features: {
    marginTop: 32,
    width: "100%",
  },
  featureItem: {
    paddingVertical: 12,
  },
  featureText: {
    fontSize: 16,
    color: AppColors.text,
    textAlign: "center",
  },
});
