import { AppColors } from "@/constants/theme";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const APP_SCHEME = "passpaymobile://transfer";

export default function TransferScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState("");
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

    try {
      setLoading(true);
      setTxSignature("");

      // Validate recipient address
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch (error) {
        Alert.alert("Error", "Invalid recipient address");
        setLoading(false);
        return;
      }

      // Create transfer instruction
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        Alert.alert("Error", "Invalid amount");
        setLoading(false);
        return;
      }

      const ix = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: transferAmount * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction with paymaster (gasless)
      const signature = await signAndSendTransaction(
        {
          instructions: [ix],
          transactionOptions: {
            feeToken: "USDC",
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: APP_SCHEME,
          onSuccess: (sig) => {
            console.log("Transaction successful:", sig);
            setTxSignature(sig);
            setRecipient("");
            setAmount("");
            Alert.alert(
              "Success",
              `Transaction sent!\n\nSignature: ${sig.substring(0, 20)}...`
            );
          },
          onFail: (error) => {
            console.error("Transaction failed:", error);
            Alert.alert("Error", "Transaction failed. Please try again.");
          },
        }
      );

      console.log("Transaction signature:", signature);
    } catch (error: any) {
      console.error("Transfer error:", error);
      Alert.alert("Error", error.message || "Failed to send transaction");
    } finally {
      setLoading(false);
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

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>Please connect your wallet first</Text>
          <Text style={styles.emptySubtext}>
            Go to the Wallet tab to connect
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send SOL</Text>
        <Text style={styles.subtitle}>
          Transfer SOL with gasless transactions
        </Text>

        <View style={styles.walletInfo}>
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
          {copied && <Text style={styles.infoText}>✓ Copied to clipboard</Text>}
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Recipient Address</Text>
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount (SOL)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={AppColors.gray}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleTransfer}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.background} />
            ) : (
              <Text style={styles.buttonText}>Send SOL</Text>
            )}
          </TouchableOpacity>

          {txSignature && (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>✅ Transaction Sent</Text>
              <Text
                style={styles.successText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {txSignature}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Gasless Transactions</Text>
          <Text style={styles.infoText}>
            Transactions are sponsored by the paymaster. You don't need SOL for
            gas fees!
          </Text>
        </View>
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
    flex: 1,
    padding: 24,
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
    marginBottom: 32,
  },
  walletInfo: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: AppColors.gray,
    marginBottom: 8,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  address: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: "500",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.text,
    borderWidth: 1,
    borderColor: AppColors.card,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: AppColors.background,
    fontSize: 16,
    fontWeight: "bold",
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
  successContainer: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.success,
  },
  successTitle: {
    fontSize: 16,
    color: AppColors.success,
    fontWeight: "bold",
    marginBottom: 8,
  },
  successText: {
    fontSize: 12,
    color: AppColors.gray,
    fontFamily: "monospace",
  },
  infoBox: {
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  infoTitle: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.gray,
    lineHeight: 20,
  },
});
