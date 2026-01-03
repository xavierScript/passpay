import { View, Text, StyleSheet } from "react-native";
import { Logo } from "./Logo";
import { AppColors } from "@/constants/theme";

interface ScreenHeaderProps {
  /** Title text to display */
  title?: string;
  /** Whether to show the logo */
  showLogo?: boolean;
  /** Logo size */
  logoSize?: number;
  /** Additional style for the container */
  style?: object;
}

/**
 * Reusable Screen Header Component
 *
 * Displays a consistent header with optional logo and title.
 *
 * @example
 * ```tsx
 * // With logo and title
 * <ScreenHeader showLogo title="Transfer SOL" />
 *
 * // Just logo
 * <ScreenHeader showLogo />
 *
 * // Just title
 * <ScreenHeader title="Staking" />
 * ```
 */
export function ScreenHeader({
  title,
  showLogo = false,
  logoSize = 32,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {showLogo && <Logo size={logoSize} />}
      {title && <Text style={styles.title}>{title}</Text>}
      {showLogo && title && <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  spacer: {
    flex: 1,
  },
});
