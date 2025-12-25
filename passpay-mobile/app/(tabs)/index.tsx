/**
 * Home Screen
 * Shows wallet balance, recent activity, and action buttons
 */

import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  formatAddress,
  formatUSDC,
} from "@/lib/constants";
import { lazorkitManager } from "@/lib/lazorkit";
import { BalanceInfo, Transaction } from "@/types";

export default function HomeScreen() {
  const router = useRouter();
  const { wallet, isConnected, disconnect } = useWallet();

  const [balance, setBalance] = useState<BalanceInfo>({
    sol: 0,
    usdc: 0,
    lastUpdated: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wallet) {
      loadWalletData();
    }
  }, [wallet]);

  const loadWalletData = async () => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      const [balanceData, txData] = await Promise.all([
        lazorkitManager.getBalances(wallet.smartWallet),
        lazorkitManager.getRecentTransactions(wallet.smartWallet, 5),
      ]);

      setBalance(balanceData);
      setTransactions(txData);
    } catch (error) {
      console.error("Failed to load wallet data:", error);
      Alert.alert("Error", "Failed to load wallet data. Pull to refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [wallet]);

  const handleCopyAddress = async () => {
    if (wallet) {
      await Clipboard.setStringAsync(wallet.smartWallet);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied", "Wallet address copied to clipboard");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await disconnect({
            onSuccess: () => router.replace("/(onboarding)/welcome"),
          });
        },
      },
    ]);
  };

  if (!isConnected || !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No wallet connected</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Your Wallet</Text>
            <Pressable
              onPress={handleCopyAddress}
              style={styles.addressContainer}
            >
              <Text style={styles.address}>
                {formatAddress(wallet.smartWallet)}
              </Text>
              <Text style={styles.copyIcon}>📋</Text>
            </Pressable>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Balance Card */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          <Text style={styles.balanceAmount}>${formatUSDC(balance.usdc)}</Text>
          <Text style={styles.solBalance}>{balance.sol.toFixed(4)} SOL</Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          entering={SlideInRight.delay(200)}
          style={styles.actionsContainer}
        >
          <ActionButton
            icon="↑"
            label="Send USDC"
            onPress={() => router.push("/send")}
            color={COLORS.primary}
          />
          <ActionButton
            icon="↓"
            label="Receive"
            onPress={() => Alert.alert("Receive", "Show QR code modal")}
            color={COLORS.success}
          />
        </Animated.View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityText}>No transactions yet</Text>
              <Text style={styles.emptyActivitySubtext}>
                Send or receive USDC to get started
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((tx, index) => (
                <TransactionItem
                  key={tx.signature}
                  transaction={tx}
                  index={index}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
        <Text style={styles.actionIconText}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function TransactionItem({
  transaction,
  index,
}: {
  transaction: Transaction;
  index: number;
}) {
  const isSend = transaction.type === "send";

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      style={styles.transactionItem}
    >
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: isSend
              ? COLORS.error + "20"
              : COLORS.success + "20",
          },
        ]}
      >
        <Text style={styles.transactionIconText}>{isSend ? "↑" : "↓"}</Text>
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {isSend ? "Sent" : "Received"} {transaction.token}
        </Text>
        <Text style={styles.transactionAddress}>
          {isSend
            ? `To: ${formatAddress(transaction.to)}`
            : `From: ${formatAddress(transaction.from)}`}
        </Text>
      </View>

      <Text
        style={[
          styles.transactionAmount,
          { color: isSend ? COLORS.error : COLORS.success },
        ]}
      >
        {isSend ? "-" : "+"}
        {transaction.amount.toFixed(2)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  address: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
  },
  copyIcon: {
    fontSize: 14,
  },
  logoutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  logoutText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  balanceAmount: {
    fontSize: TYPOGRAPHY.sizes["4xl"],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  solBalance: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconText: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  activitySection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyActivity: {
    backgroundColor: COLORS.card,
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  emptyActivityText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyActivitySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  transactionsList: {
    gap: SPACING.sm,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionAddress: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontFamily: "monospace",
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
  },
});
