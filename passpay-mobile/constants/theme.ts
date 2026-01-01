/**
 * Theme Configuration for PassPay
 *
 * Defines the app's color palette using Solana's brand colors.
 * The dark theme provides a modern, crypto-native aesthetic.
 *
 * @example
 * import { AppColors } from "@/constants/theme";
 * <View style={{ backgroundColor: AppColors.background }} />
 */

/**
 * Main app color palette - Solana-inspired dark theme
 *
 * - background: Pure black for OLED-friendly dark mode
 * - card: Slightly lighter for card components
 * - primary: Solana's signature green (#14F195)
 * - text: White for readability
 * - gray: Muted text and borders
 * - error/success/warning: Status indicators
 */
export const AppColors = {
  background: "#000000",
  card: "#1A1A1A",
  primary: "#14F195", // Solana green
  text: "#FFFFFF",
  gray: "#8F8F8F",
  error: "#FF4444",
  success: "#14F195",
  warning: "#FFB800",
};

/**
 * Tab bar theme colors for navigation
 * Used by the bottom tab navigator
 */
export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: "#0a7ea4",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#0a7ea4",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
};
