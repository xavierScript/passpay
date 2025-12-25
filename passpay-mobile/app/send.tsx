/**
 * Send USDC Screen
 * Form for sending gasless USDC transfers
 */

import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  VALIDATION,
} from "@/lib/constants";
import { lazorkitManager } from "@/lib/lazorkit";

export default function SendScreen() {
  const router = useRouter();
  const { wallet, signAndSendTransaction } = useWallet();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [amountError, setAmountError] = useState("");

  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError("Address is required");
      return false;
    }
    if (!VALIDATION.SOLANA_ADDRESS_REGEX.test(address)) {
      setAddressError("Invalid Solana address");
      return false;
    }
    setAddressError("");
    return true;
  };

  const validateAmount = (value: string) => {
    if (!value || parseFloat(value) <= 0) {
      setAmountError("Amount must be greater than 0");
      return false;
    }
    setAmountError("");
    return true;
  };

  const handleSend = async () => {
    if (!wallet || !signAndSendTransaction) {
      Alert.alert("Error", "Wallet not connected");
      return;
    }

    // Validate inputs
    const isAddressValid = validateAddress(recipientAddress);
    const isAmountValid = validateAmount(amount);

    if (!isAddressValid || !isAmountValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsSending(true);

      // Send USDC with biometric confirmation
      const signature = await lazorkitManager.sendUSDCWithBiometric(
        parseFloat(amount),
        recipientAddress,
        signAndSendTransaction,
        wallet.smartWallet
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to success screen
      router.replace({
        pathname: "/transaction-success",
        params: { signature, amount: parseFloat(amount) },
      });
    } catch (error: any) {
      console.error("Send error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        "Transaction Failed",
        error.message || "Failed to send USDC. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleScanQR = () => {
    router.push({
      pathname: "/scan-qr",
      params: {
        onScan: (address: string) => {
          setRecipientAddress(address);
          validateAddress(address);
        },
      },
    });
  };

  const isFormValid =
    recipientAddress && amount && !addressError && !amountError;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Send USDC</Text>

          {/* Recipient Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.addressInput,
                  addressError && styles.inputError,
                ]}
                placeholder="Solana address"
                placeholderTextColor={COLORS.textSecondary}
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                onBlur={() => validateAddress(recipientAddress)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable style={styles.iconButton} onPress={handleScanQR}>
                <Text style={styles.iconText}>📷</Text>
              </Pressable>
            </View>
            {addressError ? (
              <Text style={styles.errorText}>{addressError}</Text>
            ) : null}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (USDC)</Text>
            <TextInput
              style={[styles.input, amountError && styles.inputError]}
              placeholder="0.00"
              placeholderTextColor={COLORS.textSecondary}
              value={amount}
              onChangeText={setAmount}
              onBlur={() => validateAmount(amount)}
              keyboardType="decimal-pad"
            />
            {amountError ? (
              <Text style={styles.errorText}>{amountError}</Text>
            ) : null}
            <Text style={styles.hint}>Network fee: FREE (Gasless)</Text>
          </View>

          {/* Transaction Preview */}
          {isFormValid && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Transaction Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>To:</Text>
                <Text style={styles.previewValue}>
                  {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Amount:</Text>
                <Text style={styles.previewValue}>{amount} USDC</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Fee:</Text>
                <Text style={[styles.previewValue, { color: COLORS.success }]}>
                  FREE
                </Text>
              </View>
            </View>
          )}

          {/* Send Button */}
          <Pressable
            style={[
              styles.sendButton,
              (!isFormValid || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!isFormValid || isSending}
          >
            {isSending ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.sendButtonText}>Send USDC</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes["2xl"],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
  },
  addressInput: {
    flex: 1,
    fontFamily: "monospace",
  },
  inputError: {
    borderColor: COLORS.error,
  },
  iconButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  previewCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  previewValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
});
