/**
 * Create Wallet Screen
 * Guides user through biometric wallet creation
 */

import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getBiometricDisplayName,
  getBiometricSetupInfo,
} from "@/lib/biometric";
import {
  APP_CONFIG,
  COLORS,
  formatAddress,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from "@/lib/constants";
import { storeWalletInfo } from "@/lib/storage";
import { BiometricType } from "@/types";

type CreationStep = "setup" | "creating" | "success";

export default function CreateWalletScreen() {
  const router = useRouter();
  const { connect, wallet, isConnected } = useWallet();

  const [step, setStep] = useState<CreationStep>("setup");
  const [biometricInfo, setBiometricInfo] = useState<{
    available: boolean;
    enrolled: boolean;
    type: BiometricType;
    message: string;
  } | null>(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    // If wallet is connected, show success
    if (isConnected && wallet) {
      handleWalletCreated();
    }
  }, [isConnected, wallet]);

  const checkBiometricAvailability = async () => {
    const info = await getBiometricSetupInfo();
    setBiometricInfo(info);
  };

  const handleCreateWallet = async () => {
    try {
      setStep("creating");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Connect to Lazorkit (opens portal)
      await connect({
        redirectUrl: APP_CONFIG.REDIRECT_URL,
        onSuccess: (walletInfo) => {
          // Store wallet info
          storeWalletInfo(walletInfo);
        },
        onFail: (error) => {
          console.error("Failed to create wallet:", error);
          Alert.alert(
            "Wallet Creation Failed",
            "Unable to create your wallet. Please try again.",
            [{ text: "OK", onPress: () => setStep("setup") }]
          );
        },
      });
    } catch (error) {
      console.error("Create wallet error:", error);
      setStep("setup");
      Alert.alert("Error", "An error occurred while creating your wallet.", [
        { text: "OK" },
      ]);
    }
  };

  const handleWalletCreated = async () => {
    setStep("success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (wallet) {
      // Store wallet info
      await storeWalletInfo(wallet);
    }

    // Navigate to home after 2 seconds
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 2000);
  };

  const handleUsePIN = () => {
    Alert.alert(
      "Use PIN Instead",
      "You can create a wallet using your device PIN as a fallback.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: handleCreateWallet },
      ]
    );
  };

  if (!biometricInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {step === "setup" && (
          <SetupStep
            biometricInfo={biometricInfo}
            onCreateWallet={handleCreateWallet}
            onUsePIN={handleUsePIN}
          />
        )}

        {step === "creating" && <CreatingStep />}

        {step === "success" && wallet && (
          <SuccessStep walletAddress={wallet.smartWallet} />
        )}
      </View>
    </SafeAreaView>
  );
}

function SetupStep({
  biometricInfo,
  onCreateWallet,
  onUsePIN,
}: {
  biometricInfo: any;
  onCreateWallet: () => void;
  onUsePIN: () => void;
}) {
  const biometricName = getBiometricDisplayName(biometricInfo.type);

  return (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Text style={styles.bigIcon}>🔐</Text>
      </View>

      <Text style={styles.title}>Create Your Wallet</Text>
      <Text style={styles.subtitle}>
        {biometricInfo.enrolled
          ? `Use ${biometricName} to secure your wallet. No seed phrases needed.`
          : biometricInfo.message}
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ✓ Your passkey is stored securely on this device{"\n"}✓ Access your
          wallet with {biometricName}
          {"\n"}✓ No complex backups required
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onCreateWallet}
        >
          <Text style={styles.primaryButtonText}>
            Create Wallet with {biometricName}
          </Text>
        </Pressable>

        {!biometricInfo.enrolled && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={onUsePIN}
          >
            <Text style={styles.secondaryButtonText}>Use PIN Instead</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

function CreatingStep() {
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.stepContainer}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.title}>Generating Your Wallet...</Text>
      <Text style={styles.subtitle}>This will only take a moment</Text>
    </Animated.View>
  );
}

function SuccessStep({ walletAddress }: { walletAddress: string }) {
  return (
    <Animated.View entering={ZoomIn.duration(500)} style={styles.stepContainer}>
      <Animated.View entering={ZoomIn.delay(200)} style={styles.successIcon}>
        <Text style={styles.bigIcon}>✅</Text>
      </Animated.View>

      <Text style={styles.title}>Wallet Created!</Text>
      <Text style={styles.subtitle}>Your Solana wallet is ready to use</Text>

      <View style={styles.addressBox}>
        <Text style={styles.addressLabel}>Your Wallet Address</Text>
        <Text style={styles.address}>{formatAddress(walletAddress, 8)}</Text>
      </View>

      <Text style={styles.redirectText}>Redirecting to home...</Text>
    </Animated.View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  bigIcon: {
    fontSize: 80,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes["3xl"],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingHorizontal: SPACING.md,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.text,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: SPACING.md,
    marginTop: SPACING.lg,
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
  buttonPressed: {
    opacity: 0.7,
  },
  addressBox: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    width: "100%",
    alignItems: "center",
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  address: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
    fontFamily: "monospace",
  },
  redirectText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
