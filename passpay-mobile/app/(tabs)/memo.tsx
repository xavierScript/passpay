/**
 * Memo Screen - On-Chain Messages
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Writing Permanent Messages on Solana
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This screen demonstrates using Solana's Memo Program with LazorKit:
 * - Store arbitrary text permanently on the blockchain
 * - Simple transaction that proves LazorKit integration works
 * - Great for: proof of existence, timestamps, on-chain notes
 *
 * WHAT IS THE MEMO PROGRAM?
 * -------------------------
 * The Memo Program (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr) is one of
 * Solana's simplest programs. It just stores UTF-8 text data in a transaction.
 * The data is permanently recorded on-chain and can be verified forever.
 *
 * KEY CONCEPTS:
 * - `createMemoInstruction()`: Creates instruction with message data
 * - Messages are stored in the transaction log, not an account
 * - Max ~566 bytes per memo (varies with transaction size)
 *
 * This is a great "hello world" for LazorKit - if this works, your
 * integration is set up correctly!
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { AppColors } from "@/constants/theme";
import {
  useLazorkitTransaction,
  useTransactionHistory,
  useWalletGuard,
} from "@/hooks";
import { createMemoInstruction } from "@/services/memo";
import { memoStyles as styles } from "@/styles";
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

/**
 * Memo History Record Type
 */
interface MemoRecord {
  message: string;
}

export default function MemoScreen() {
  // ✨ Using custom hooks for cleaner, reusable code
  const { isConnected, publicKey, NotConnectedView } = useWalletGuard({
    icon: "📝",
    message: "Connect wallet to write memos",
  });

  const { history, addTransaction, openInExplorer } =
    useTransactionHistory<MemoRecord>();

  const [message, setMessage] = useState("");

  const { execute, loading: sending } = useLazorkitTransaction({
    successAlertTitle: "Memo Saved! ✅",
    successAlertMessage:
      "Your message is now permanently on the Solana blockchain!",
    onSuccess: (signature) => {
      addTransaction(signature, { message: message.trim() });
      setMessage("");
    },
  });

  const handleSendMemo = async () => {
    if (!isConnected || !publicKey) {
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

    console.log("Creating memo:", message.trim());

    // Create memo instruction
    const memoInstruction = createMemoInstruction(message.trim(), publicKey);

    // ✨ Execute using the hook - handles loading, errors, alerts automatically!
    await execute({
      instructions: [memoInstruction],
      redirectPath: "memo",
    });
  };

  // Not connected state - using NotConnectedView from hook
  if (!isConnected) {
    return <NotConnectedView />;
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

        {/* History - using useTransactionHistory hook */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Memos</Text>
            {history.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => openInExplorer(item.signature)}
              >
                <Text style={styles.historyMessage} numberOfLines={2}>
                  "{item.data.message}"
                </Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyTime}>{item.formattedTime}</Text>
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
