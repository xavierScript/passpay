/**
 * Staking Screen - Native SOL Staking
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Staking SOL with Passkey Authentication
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This screen demonstrates complex multi-instruction transactions:
 * - Create a stake account (using createAccountWithSeed)
 * - Delegate stake to a validator
 * - View existing stake accounts and their status
 *
 * WHY USE createAccountWithSeed?
 * ------------------------------
 * Normally, creating a stake account requires a NEW keypair that must
 * sign the transaction. But LazorKit only provides the smart wallet signer.
 *
 * Solution: Use `createAccountWithSeed()` which derives the account address
 * from the wallet's public key + a seed string. This means:
 * - No additional signers needed!
 * - The stake account address is deterministic
 * - Works perfectly with LazorKit's passkey-only signing
 *
 * TRANSACTION STRUCTURE:
 * 1. StakeProgram.createAccountWithSeed() - Creates the stake account
 * 2. StakeProgram.delegate() - Delegates to chosen validator
 *
 * Both instructions are bundled into a single atomic transaction.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { AppColors } from "@/constants/theme";
import { useLazorkitTransaction, useSolBalance, useWalletGuard } from "@/hooks";
import { getConnection } from "@/services/rpc";
import {
  createStakeAccountInstructions,
  getStakeAccounts,
  MIN_STAKE_AMOUNT,
  StakeAccountInfo,
} from "@/services/staking";
import { stakeStyles as styles } from "@/styles";
import { getAddressExplorerUrl } from "@/utils/helpers";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Logo } from "@/components/Logo";

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
  // ✨ Using custom hooks for cleaner, reusable code
  const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
    icon: "🥩",
    message: "Connect wallet to stake SOL",
  });

  const {
    balance: solBalance,
    loading: balanceLoading,
    refresh: refreshBalance,
    refreshControl,
  } = useSolBalance();

  const { execute, loading: staking } = useLazorkitTransaction({
    successAlertTitle: "Staked Successfully! 🎉",
    onSuccess: () => {
      setAmount("");
      // Refresh data after staking
      refreshBalance();
      fetchStakeAccounts();
    },
  });

  const [amount, setAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string | null>(
    STATIC_VALIDATORS[0].voteAccount
  );
  const [validators] = useState<Validator[]>(STATIC_VALIDATORS);
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccountInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const connection = getConnection();

  const fetchStakeAccounts = useCallback(async () => {
    if (!publicKey) return;

    try {
      const accounts = await getStakeAccounts(connection, publicKey);
      setStakeAccounts(accounts);
      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching stake accounts:", error);
    }
  }, [publicKey, connection]);

  // Only fetch stake accounts when tab is focused (balance handled by useSolBalance)
  useFocusEffect(
    useCallback(() => {
      if (isConnected && publicKey && !hasFetched) {
        setLoading(true);
        fetchStakeAccounts().finally(() => setLoading(false));
      }
    }, [isConnected, publicKey, hasFetched, fetchStakeAccounts])
  );

  const handleStake = async () => {
    if (!isConnected || !publicKey) {
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

    console.log("Creating stake account:", {
      amount: stakeAmount,
      validator: selectedValidator,
    });

    try {
      // Create stake instructions using seed-based account (no additional signers!)
      const { instructions, stakeAccountPubkey, seed } =
        await createStakeAccountInstructions(
          connection,
          publicKey,
          stakeAmount,
          new PublicKey(selectedValidator)
        );

      console.log(`Created ${instructions.length} stake instructions`);
      console.log(`Stake account: ${stakeAccountPubkey.toBase58()}`);
      console.log(`Seed: ${seed}`);

      // ✨ Execute using the hook - handles loading, errors, alerts automatically!
      await execute({
        instructions,
        redirectPath: "stake",
        computeUnitLimit: 200_000,
      });
    } catch (error: any) {
      console.error("Stake error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to stake. Please try again."
      );
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

  // Not connected state - using NotConnectedView from hook
  if (!isConnected) {
    return <NotConnectedView />;
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      <View style={styles.content}>
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <Logo size={36} />
        </View>
        <Text style={styles.title}>Stake SOL</Text>
        <Text style={styles.subtitle}>
          Earn rewards by staking with validators
        </Text>

        {/* Balance Card - using useSolBalance hook */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>
            {balanceLoading ? "Loading..." : `${solBalance.toFixed(4)} SOL`}
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
