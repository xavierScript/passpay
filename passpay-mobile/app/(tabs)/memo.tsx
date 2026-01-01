/**
 * Memo Screen - Write permanent messages on Solana blockchain
 *
 * Uses the Memo Program to store text on-chain. Simple, guaranteed to work,
 * and a great way to prove LazorKit integration is working correctly.
 */

import { AppColors } from "@/constants/theme";
import { createMemoInstruction } from "@/services/memo";
import { getExplorerUrl } from "@/utils/helpers";
import { getRedirectUrl } from "@/utils/redirect-url";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
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

export default function MemoScreen() {
  const { signAndSendTransaction, smartWalletPubkey, isConnected } =
    useWallet();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<
    { message: string; signature: string; timestamp: Date }[]
  >([]);

  const handleSendMemo = async () => {
    if (!isConnected || !smartWalletPubkey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    if (message.length > 500) {
      Alert.alert("Error", "Message too long. Maximum 500 characters.");
      return;
    }

    try {
      Keyboard.dismiss();
      setSending(true);

      console.log("Creating memo:", message.trim());

      // Create memo instruction
      const memoInstruction = createMemoInstruction(
        message.trim(),
        smartWalletPubkey
      );

      // Sign and send via LazorKit
      await signAndSendTransaction(
        {
          instructions: [memoInstruction],
          transactionOptions: {
            clusterSimulation: "devnet",
          },
        },
        {
          redirectUrl: getRedirectUrl("memo"),
          onSuccess: (sig) => {
            console.log("Memo sent successfully:", sig);

            // Add to history
            setHistory((prev) => [
              {
                message: message.trim(),
                signature: sig,
                timestamp: new Date(),
              },
              ...prev,
            ]);

            setMessage("");
            Alert.alert(
              "Memo Saved! ✅",
              `Your message is now permanently on the Solana blockchain!\n\nTx: ${sig.substring(
                0,
                20
              )}...`
            );
          },
          onFail: (error) => {
            console.error("Memo failed:", error);
            Alert.alert(
              "Failed",
              error?.message || "Failed to send memo. Please try again."
            );
          },
        }
      );
    } catch (error: any) {
      console.error("Memo error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to send memo. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const openExplorer = (signature: string) => {
    Linking.openURL(getExplorerUrl(signature));
  };

  // Not connected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Connect wallet to write memos</Text>
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
        <Text style={styles.title}>On-Chain Memo</Text>
        <Text style={styles.subtitle}>Write permanent messages on Solana</Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What is a Memo?</Text>
            <Text style={styles.infoText}>
              Memos are text messages stored permanently on the Solana
              blockchain. Great for proof of existence, timestamping ideas, or
              leaving on-chain notes.
            </Text>
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Your Message</Text>
          <TextInput
            style={styles.textArea}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here...&#10;&#10;This will be stored on-chain forever! 🚀"
            placeholderTextColor={AppColors.gray}
            multiline
            numberOfLines={5}
            maxLength={500}
            editable={!sending}
          />
          <Text style={styles.charCount}>{message.length}/500 characters</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMemo}
          disabled={sending || !message.trim()}
        >
          {sending ? (
            <View style={styles.sendingContainer}>
              <ActivityIndicator color={AppColors.background} />
              <Text style={styles.sendButtonText}> Sending...</Text>
            </View>
          ) : (
            <Text style={styles.sendButtonText}>📤 Send Memo</Text>
          )}
        </TouchableOpacity>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Memos</Text>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => openExplorer(item.signature)}
              >
                <Text style={styles.historyMessage} numberOfLines={2}>
                  "{item.message}"
                </Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyTime}>
                    {item.timestamp.toLocaleTimeString()}
                  </Text>
                  <Text style={styles.historyLink}>View on Explorer →</Text>
                </View>
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
  textArea: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: AppColors.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: AppColors.gray,
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
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
  historyMessage: {
    fontSize: 14,
    color: AppColors.text,
    fontStyle: "italic",
    marginBottom: 8,
  },
  historyMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTime: {
    fontSize: 12,
    color: AppColors.gray,
  },
  historyLink: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "500",
  },
});
