/**
 * Welcome Screen
 * First screen users see - introduces the app
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/lib/constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon Area */}
        <Animated.View
          entering={FadeIn.duration(800)}
          style={styles.logoContainer}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔐</Text>
          </View>
          <Text style={styles.appName}>PassPay</Text>
          <Text style={styles.tagline}>Your Seedless Solana Wallet</Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          entering={SlideInDown.delay(200).duration(600)}
          style={styles.featuresContainer}
        >
          <FeatureItem
            icon="🔒"
            title="No Seed Phrases"
            description="Your device is your wallet. No complex backups needed."
          />
          <FeatureItem
            icon="⚡"
            title="Gasless Transfers"
            description="Send USDC without worrying about network fees."
          />
          <FeatureItem
            icon="👆"
            title="Face ID Secured"
            description="Authenticate with biometrics you already use."
          />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          entering={SlideInDown.delay(400).duration(600)}
          style={styles.ctaContainer}
        >
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(onboarding)/create-wallet")}
          >
            <LinearGradient
              colors={[COLORS.primary, "#0FA87A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.disclaimer}>
            Powered by Lazorkit on Solana Devnet
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
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
    justifyContent: "space-between",
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: SPACING["2xl"],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes["4xl"],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.textSecondary,
  },
  featuresContainer: {
    gap: SPACING.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  featureDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  ctaContainer: {
    gap: SPACING.md,
  },
  button: {
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
