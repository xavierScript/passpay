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
  createTransferInstruction,
  getExplorerUrl,
  validateAddress,
  validateAmount,
} from "@/services/transfer";
import { transferStyles as styles } from "@/styles";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TransferScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { recipient: string; amount: string; signature: string; timestamp: Date }[]
  >([]);
  const [copied, setCopied] = useState(false);

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * 📚 TUTORIAL: Creating & Sending a Gasless Transfer
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * STEP 1: Validate inputs (address and amount)
   * STEP 2: Create a SystemProgram.transfer() instruction
   * STEP 3: Call signAndSendTransaction() with paymaster config:
   *
   * ```typescript
   * await signAndSendTransaction(
   *   {
   *     instructions: [transferInstruction],
   *     transactionOptions: {
   *       feeToken: "USDC",           // 👈 This enables gasless!
   *       clusterSimulation: "devnet", // Network to use
   *     },
   *   },
   *   {
   *     redirectUrl: "yourapp://callback", // Deep link back
   *     onSuccess: (signature) => { ... },
   *     onFail: (error) => { ... },
   *   }
   * );
   * ```
   *
   * The paymaster will deduct USDC equivalent of gas from user's balance.
   */
  const handleTransfer = async () => {
    if (!isConnected || !smartWalletPubkey) {
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

    try {
      Keyboard.dismiss();
      setLoading(true);

      console.log("Creating transfer:", {
        recipient: recipient,
        amount: transferAmount,
      });

      // Create transfer instruction
      const ix = createTransferInstruction(
        smartWalletPubkey,
        recipientPubkey,
        transferAmount
      );

      // Sign and send transaction with paymaster (gasless)
      await signAndSendTransaction(
        {
          instructions: [ix],
          transactionOptions: {
            feeToken: "USDC",
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: getRedirectUrl("transfer"),
          onSuccess: (sig) => {
            console.log("Transfer successful:", sig);

            // Add to history
            setHistory((prev) => [
              {
                recipient: recipient,
                amount: amount,
                signature: sig,
                timestamp: new Date(),
              },
              ...prev,
            ]);

            setRecipient("");
            setAmount("");
            Alert.alert(
              "Transfer Sent! ✅",
              `Successfully sent ${transferAmount} SOL!\n\nTx: ${sig.substring(
                0,
                20
              )}...`
            );
          },
          onFail: (error) => {
            console.error("Transfer failed:", error);
            Alert.alert(
              "Failed",
              error?.message || "Transaction failed. Please try again."
            );
          },
        }
      );
    } catch (error: any) {
      console.error("Transfer error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to send transaction. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openExplorer = (signature: string) => {
    Linking.openURL(getExplorerUrl(signature));
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

  // Not connected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>💸</Text>
          <Text style={styles.emptyText}>Connect wallet to send SOL</Text>
          <Text style={styles.emptySubtext}>
            Go to the Wallet tab to connect
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
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
              {smartWalletPubkey?.toBase58()}
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

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Transfers</Text>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => openExplorer(item.signature)}
              >
                <View style={styles.historyHeader}>
                  <Text style={styles.historyAmount}>{item.amount} SOL</Text>
                  <Text style={styles.historyTime}>
                    {item.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Text
                  style={styles.historyRecipient}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  To: {item.recipient}
                </Text>
                <Text style={styles.historyLink}>View on Explorer →</Text>
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
