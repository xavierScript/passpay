/**
 * Loading Overlay Component
 * Full-screen loading indicator for async operations
 */

import { COLORS, SPACING, TYPOGRAPHY } from "@/lib/constants";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({
  visible,
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: COLORS.card,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: "center",
    gap: SPACING.md,
    minWidth: 200,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
    textAlign: "center",
  },
});
