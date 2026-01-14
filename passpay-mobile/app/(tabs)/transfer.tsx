/**
 * Transfer Screen - Gasless SOL Transfers
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Sending Gasless Transactions with LazorKit
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This screen demonstrates LazorKit's gasless transaction feature:
 * - Users send SOL without paying gas fees themselves
 * - A paymaster sponsors the transaction fees (paid in USDC)
 * - Perfect for onboarding users who don't have SOL for fees
 *
 * WHAT IS A GASLESS TRANSACTION?
 * ------------------------------
 * On Solana, every transaction requires a small SOL fee (~0.000005 SOL).
 * LazorKit's paymaster service pays these fees on behalf of users,
 * deducting the equivalent value from their USDC balance instead.
 *
 * KEY CONCEPTS:
 * - `signAndSendTransaction()`: Signs with passkey and broadcasts to network
 * - `transactionOptions.feeToken`: Specify "USDC" for gasless (paymaster pays)
 * - `instructions`: Array of Solana instructions to execute
 * - `clusterSimulation`: "devnet" or "mainnet-beta"
 *
 * FLOW:
 * 1. Create transfer instruction using SystemProgram.transfer()
 * 2. Call signAndSendTransaction() with instructions + paymaster config
 * 3. User authenticates with biometrics in LazorKit portal
 * 4. Transaction is submitted to Solana network
 * 5. onSuccess callback receives the transaction signature
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { AppColors } from "@/constants/theme";
import {
  useClipboard,
  useLazorkitTransaction,
  useTransactionHistory,
  useWalletGuard,
} from "@/hooks";
import {
  createTransferInstruction,
  validateAddress,
  validateAmount,
} from "@/feature-examples/transfer/services";
import { transferStyles as styles } from "@/styles";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Logo } from "@/components";

/**
 * Transfer History Record Type
 */
interface TransferRecord {
  recipient: string;
  amount: string;
}

export default function TransferScreen() {
  // ✨ Using custom hooks for cleaner, reusable code
  const { isConnected, address, publicKey, NotConnectedView } = useWalletGuard({
    icon: "💸",
    message: "Connect wallet to send SOL",
  });

  const { copy, copied } = useClipboard();

  const { history, addTransaction, openInExplorer } =
    useTransactionHistory<TransferRecord>({
      storageKey: "transfer_history",
    });

  const { execute, loading } = useLazorkitTransaction({
    gasless: true,
    successAlertTitle: "Transfer Sent! ✅",
    successAlertMessage: "Successfully sent SOL!",
    onSuccess: (signature) => {
      // Add to history using the hook
      addTransaction(signature, { recipient, amount });
      setRecipient("");
      setAmount("");
    },
  });

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Creating & Sending a Gasless Transfer
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Validate inputs (address and amount)
   * STEP 2: Create a SystemProgram.transfer() instruction
   * STEP 3: Use useLazorkitTransaction hook with gasless: true
   *
   * The hook handles all the complexity:
   * - Loading states
   * - Error handling with alerts
   * - Paymaster configuration for gasless
   * - Success/failure callbacks
   *
   * ```typescript
   * const { execute, loading } = useLazorkitTransaction({
   *   gasless: true,  // 👈 This enables paymaster!
   *   onSuccess: (sig) => { ... },
   * });
   *
   * await execute({
   *   instructions: [transferInstruction],
   *   redirectPath: 'transfer',
   * });
   * ```
   */
  const handleTransfer = async () => {
    if (!isConnected || !publicKey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!recipient || !amount) {
      Alert.alert("Error", "Please enter recipient address and amount");
      return;
    }

    // Validate recipient address
    const recipientPubkey = validateAddress(recipient);
    if (!recipientPubkey) {
      Alert.alert("Error", "Invalid recipient address");
      return;
    }

    // Validate amount
    const transferAmount = validateAmount(amount);
    if (transferAmount === null) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    console.log("Creating transfer:", {
      recipient: recipient,
      amount: transferAmount,
    });

    // Create transfer instruction
    const ix = createTransferInstruction(
      publicKey,
      recipientPubkey,
      transferAmount
    );

    // ✨ Execute using the hook - handles loading, errors, alerts automatically!
    await execute({
      instructions: [ix],
      redirectPath: "transfer",
    });
  };

  // ✨ Using useClipboard hook
  const handleCopyAddress = () => {
    if (address) {
      copy(address);
    }
  };

  // Not connected state - using NotConnectedView from hook
  if (!isConnected) {
    return <NotConnectedView />;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={36} />
        </View>
        <Text style={styles.title}>Send SOL</Text>
        <Text style={styles.subtitle}>
          Transfer SOL with gasless transactions
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Gasless Transactions</Text>
            <Text style={styles.infoText}>
              Transactions are sponsored by the paymaster. You don't need SOL
              for gas fees - just the amount you want to send!
            </Text>
          </View>
        </View>

        {/* Wallet Info */}
        <View style={styles.walletCard}>
          <Text style={styles.label}>Your Wallet</Text>
          <TouchableOpacity onPress={handleCopyAddress} activeOpacity={0.7}>
            <Text
              style={styles.address}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {address}
            </Text>
          </TouchableOpacity>
          {copied && (
            <Text style={styles.copiedText}>✓ Copied to clipboard</Text>
          )}
        </View>

        {/* Transfer Form */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Enter Solana address"
            placeholderTextColor={AppColors.gray}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Amount (SOL)</Text>
          <TextInput
            style={[styles.input, styles.amountInput]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            placeholderTextColor={AppColors.gray}
            keyboardType="decimal-pad"
            editable={!loading}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleTransfer}
          disabled={loading || !recipient || !amount}
        >
          {loading ? (
            <View style={styles.sendingContainer}>
              <ActivityIndicator color={AppColors.background} />
              <Text style={styles.sendButtonText}> Sending...</Text>
            </View>
          ) : (
            <Text style={styles.sendButtonText}>💸 Send SOL</Text>
          )}
        </TouchableOpacity>

        {/* History - using useTransactionHistory hook */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Transfers</Text>
            {history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => openInExplorer(item.signature)}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyAmount}>
                    {item.data.amount} SOL
                  </Text>
                  <Text style={styles.historyTime}>{item.formattedTime}</Text>
                </View>
                <Text
                  style={styles.historyRecipient}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  To: {item.data.recipient}
                </Text>
                <Text style={styles.historyLink}>View on Explorer →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </View>
    </ScrollView>
  );
}
