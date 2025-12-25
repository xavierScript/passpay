/**
 * Transaction Success Screen
 * Shows success animation and transaction details
 */

import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COLORS,
  getExplorerUrl,
  RADIUS,
  SOLANA_CONFIG,
  SPACING,
  TYPOGRAPHY,
} from "@/lib/constants";

export default function TransactionSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signature, amount } = params;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleViewOnSolscan = () => {
    if (signature && typeof signature === "string") {
      const url = getExplorerUrl(signature, SOLANA_CONFIG.CLUSTER);
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={ZoomIn.duration(500)}
          style={styles.iconContainer}
        >
          <Text style={styles.successIcon}>✅</Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(300)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>Transaction Sent!</Text>
          <Text style={styles.subtitle}>
            Your {amount} USDC has been sent successfully
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500)} style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{amount} USDC</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee:</Text>
            <Text style={[styles.detailValue, { color: COLORS.success }]}>
              FREE
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Signature:</Text>
            <Text style={styles.signatureValue} numberOfLines={1}>
              {typeof signature === "string"
                ? signature.slice(0, 16) + "..."
                : "N/A"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(700)}
          style={styles.buttonsContainer}
        >
          <Pressable style={styles.primaryButton} onPress={handleViewOnSolscan}>
            <Text style={styles.primaryButtonText}>View on Solscan</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.autoRedirectText}>
          Auto-redirecting in a few seconds...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  successIcon: {
    fontSize: 100,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes["3xl"],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    width: "100%",
    marginBottom: SPACING.xl,
  },
  detailsTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  signatureValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    fontFamily: "monospace",
    maxWidth: "60%",
  },
  buttonsContainer: {
    width: "100%",
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  autoRedirectText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
});
