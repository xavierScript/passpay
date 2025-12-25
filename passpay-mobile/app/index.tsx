/**
 * Entry Point Screen
 * Checks if user has a wallet and redirects accordingly
 */

import { COLORS } from "@/lib/constants";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function IndexScreen() {
  const router = useRouter();
  const { isConnected, wallet } = useWallet();

  useEffect(() => {
    // Small delay to ensure provider is ready
    const timer = setTimeout(() => {
      if (isConnected && wallet) {
        // User has a wallet, go to home
        router.replace("/(tabs)");
      } else {
        // No wallet, go to onboarding
        router.replace("/(onboarding)/welcome");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isConnected, wallet, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
