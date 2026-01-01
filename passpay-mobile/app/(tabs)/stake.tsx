/**
 * Staking Screen - Stake SOL to earn rewards
 *
 * Uses Solana's native Stake Program to delegate SOL to validators.
 * Uses createAccountWithSeed to avoid needing additional signers.
 */

import { AppColors } from "@/constants/theme";
import { clearCache, getConnection, getSolBalance } from "@/services/rpc";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  MIN_STAKE_AMOUNT,
  StakeAccountInfo,
} from "@/services/staking";
import { getAddressExplorerUrl } from "@/utils/helpers";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Hardcoded validators to avoid RPC call - getVoteAccounts is expensive
const STATIC_VALIDATORS = [
  {
    voteAccount: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
    nodePubkey: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
    stake: 1000000,
  },
  {
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
    nodePubkey: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
    stake: 500000,
  },
  {
    voteAccount: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
    nodePubkey: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
    stake: 250000,
  },
];

interface Validator {
  voteAccount: string;
  nodePubkey: string;
  stake: number;
}

export default function StakeScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string | null>(
    STATIC_VALIDATORS[0].voteAccount
  );
  const [validators] = useState<Validator[]>(STATIC_VALIDATORS);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [staking, setStaking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const connection = getConnection();

  const fetchData = useCallback(async () => {
    if (!smartWalletPubkey) return;

    try {
      // Fetch SOL balance (cached)
      const balance = await getSolBalance(smartWalletPubkey);
      setSolBalance(balance);

      // Only fetch stake accounts if needed (expensive call)
      if (!hasFetched) {
        const accounts = await getStakeAccounts(connection, smartWalletPubkey);
        setStakeAccounts(accounts);
        setHasFetched(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [smartWalletPubkey, hasFetched]);

  // Only fetch when tab is focused, not on mount
  useFocusEffect(
    useCallback(() => {
      if (isConnected && smartWalletPubkey) {
        setLoading(true);
        fetchData().finally(() => setLoading(false));
      }
    }, [isConnected, smartWalletPubkey])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    clearCache();
    setHasFetched(false);
    await fetchData();
    setRefreshing(false);
  };

  const handleStake = async () => {
    if (!isConnected || !smartWalletPubkey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    const stakeAmount = parseFloat(amount);

    if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE_AMOUNT) {
      Alert.alert("Error", `Minimum stake amount is ${MIN_STAKE_AMOUNT} SOL`);
      return;
    }

    if (solBalance !== null && stakeAmount > solBalance - 0.01) {
      Alert.alert(
        "Insufficient Balance",
        `You need at least ${stakeAmount + 0.01} SOL (stake + fees)`
      );
      return;
    }

    if (!selectedValidator) {
      Alert.alert("Error", "Please select a validator");
      return;
    }

    try {
      Keyboard.dismiss();
      setStaking(true);

      console.log("Creating stake account:", {
        amount: stakeAmount,
        validator: selectedValidator,
      });

      // Create stake instructions using seed-based account (no additional signers!)
      const { instructions, stakeAccountPubkey, seed } =
        await createStakeAccountInstructions(
          connection,
          smartWalletPubkey,
          stakeAmount,
          new PublicKey(selectedValidator)
        );

      console.log(`Created ${instructions.length} stake instructions`);
      console.log(`Stake account: ${stakeAccountPubkey.toBase58()}`);
      console.log(`Seed: ${seed}`);

      // Sign and send via LazorKit
      await signAndSendTransaction(
        {
          instructions,
          transactionOptions: {
            clusterSimulation: "devnet",
            computeUnitLimit: 200_000,
          },
        },
        {
          redirectUrl: getRedirectUrl("stake"),
          onSuccess: (sig) => {
            console.log("Stake successful:", sig);
            setAmount("");
            Alert.alert(
              "Staked Successfully! 🎉",
              `You've staked ${stakeAmount} SOL!\n\nStake Account:\n${stakeAccountPubkey
                .toBase58()
                .substring(0, 24)}...`
            );
            // Refresh data
            fetchData();
          },
          onFail: (error) => {
            console.error("Stake failed:", error);
            Alert.alert(
              "Staking Failed",
              error?.message || "Failed to stake. Please try again."
            );
          },
        }
      );
    } catch (error: any) {
      console.error("Stake error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to stake. Please try again."
      );
    } finally {
      setStaking(false);
    }
  };

  const openExplorer = (address: string) => {
    Linking.openURL(getAddressExplorerUrl(address));
  };

  const getStateColor = (state: StakeAccountInfo["state"]) => {
    switch (state) {
      case "active":
        return AppColors.success;
      case "activating":
        return AppColors.warning;
      case "deactivating":
        return AppColors.error;
      default:
        return AppColors.gray;
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>🥩</Text>
          <Text style={styles.emptyText}>Connect wallet to stake SOL</Text>
          <Text style={styles.emptySubtext}>
            Go to the Wallet tab to connect
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={AppColors.primary}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Stake SOL</Text>
        <Text style={styles.subtitle}>
          Earn rewards by staking with validators
        </Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {solBalance !== null
              ? `${solBalance.toFixed(4)} SOL`
              : "Loading..."}
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How Staking Works</Text>
            <Text style={styles.infoText}>
              Delegate your SOL to validators to help secure the network and
              earn ~6-8% APY rewards. Unstaking takes ~2-3 days.
            </Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Stake Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.1"
            placeholderTextColor={AppColors.gray}
            keyboardType="decimal-pad"
            editable={!staking}
          />
          <Text style={styles.minAmount}>Minimum: {MIN_STAKE_AMOUNT} SOL</Text>
        </View>

        {/* Validator Selection */}
        <View style={styles.validatorSection}>
          <Text style={styles.sectionTitle}>Select Validator</Text>
          {loading ? (
            <ActivityIndicator color={AppColors.primary} />
          ) : validators.length === 0 ? (
            <Text style={styles.noValidators}>
              No validators found. Pull to refresh.
            </Text>
          ) : (
            validators.slice(0, 5).map((validator) => (
              <TouchableOpacity
                key={validator.voteAccount}
                style={[
                  styles.validatorItem,
                  selectedValidator === validator.voteAccount &&
                    styles.validatorSelected,
                ]}
                onPress={() => setSelectedValidator(validator.voteAccount)}
                disabled={staking}
              >
                <View style={styles.validatorInfo}>
                  <Text style={styles.validatorName}>
                    {validator.nodePubkey.substring(0, 8)}...
                  </Text>
                  <Text style={styles.validatorStake}>
                    {(validator.stake / 1_000_000).toFixed(1)}M SOL staked
                  </Text>
                </View>
                {selectedValidator === validator.voteAccount && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Stake Button */}
        <TouchableOpacity
          style={[styles.stakeButton, staking && styles.stakeButtonDisabled]}
          onPress={handleStake}
          disabled={staking || !amount || !selectedValidator}
        >
          {staking ? (
            <View style={styles.stakingContainer}>
              <ActivityIndicator color={AppColors.background} />
              <Text style={styles.stakeButtonText}> Staking...</Text>
            </View>
          ) : (
            <Text style={styles.stakeButtonText}>🥩 Stake SOL</Text>
          )}
        </TouchableOpacity>

        {/* Existing Stake Accounts */}
        {stakeAccounts.length > 0 && (
          <View style={styles.accountsSection}>
            <Text style={styles.sectionTitle}>Your Stake Accounts</Text>
            {stakeAccounts.map((account, index) => (
              <TouchableOpacity
                key={index}
                style={styles.accountItem}
                onPress={() => openExplorer(account.address)}
              >
                <View style={styles.accountHeader}>
                  <Text style={styles.accountAddress}>
                    {account.address.substring(0, 16)}...
                  </Text>
                  <View
                    style={[
                      styles.stateBadge,
                      { backgroundColor: getStateColor(account.state) },
                    ]}
                  >
                    <Text style={styles.stateText}>{account.state}</Text>
                  </View>
                </View>
                <Text style={styles.accountBalance}>
                  {(account.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.gray,
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: AppColors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: AppColors.gray,
  },
  balanceCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.text,
  },
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.gray,
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: AppColors.gray,
    marginBottom: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
    textAlign: "center",
  },
  minAmount: {
    fontSize: 12,
    color: AppColors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  validatorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 16,
  },
  noValidators: {
    fontSize: 14,
    color: AppColors.gray,
    textAlign: "center",
    padding: 20,
  },
  validatorItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
  },
  validatorSelected: {
    borderColor: AppColors.primary,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  validatorInfo: {
    flex: 1,
  },
  validatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.text,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  validatorStake: {
    fontSize: 12,
    color: AppColors.gray,
  },
  checkmark: {
    fontSize: 20,
    color: AppColors.primary,
    fontWeight: "bold",
  },
  stakeButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  stakeButtonDisabled: {
    opacity: 0.5,
  },
  stakingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stakeButtonText: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  accountsSection: {
    marginTop: 8,
  },
  accountItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountAddress: {
    fontSize: 14,
    color: AppColors.text,
    fontFamily: "monospace",
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stateText: {
    fontSize: 10,
    color: AppColors.background,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
});
