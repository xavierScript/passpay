/**
 * Transfer Screen - Send SOL with gasless transactions
 *
 * Uses LazorKit's paymaster for sponsored transactions, allowing users
 * to send SOL without needing to pay gas fees themselves.
 */

import { AppColors } from "@/constants/theme";
import {
  createTransferInstruction,
  getExplorerUrl,
  validateAddress,
  validateAmount,
} from "@/services/transfer";
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
  StyleSheet,
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
  infoCard: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  walletCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  copiedText: {
    fontSize: 12,
    color: AppColors.primary,
    marginTop: 8,
    fontWeight: "500",
  },
  inputCard: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 16,
    color: AppColors.text,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  sendButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sendButtonText: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: "bold",
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.text,
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.text,
  },
  historyTime: {
    fontSize: 12,
    color: AppColors.gray,
  },
  historyRecipient: {
    fontSize: 12,
    color: AppColors.gray,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  historyLink: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "500",
  },
});
