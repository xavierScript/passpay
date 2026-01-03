import { Image, Text, View, StyleSheet } from "react-native";

interface LogoProps {
  /** Size of the logo in pixels */
  size?: number;
  /** Whether to show the text alongside the logo */
  showText?: boolean;
  /** Whether to use circular container */
  circular?: boolean;
  /** Additional style for the container */
  containerStyle?: object;
}

/**
 * PassPay Logo Component
 *
 * Displays the PassPay logo with optional text and customizable size.
 *
 * @example
 * ```tsx
 * // Small logo without text
 * <Logo size={40} />
 *
 * // Large logo with text
 * <Logo size={60} showText />
 *
 * // Circular background
 * <Logo size={80} circular />
 * ```
 */
export function Logo({
  size = 60,
  showText = false,
  circular = false,
  containerStyle,
}: LogoProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          circular && {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: (size * 1.6) / 2,
            backgroundColor: "rgba(20, 241, 149, 0.1)",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Image
          source={require("@/assets/images/passpay-icon.png")}
          style={{
            width: size,
            height: size,
            borderRadius: circular ? size / 2 : size / 8,
          }}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: size / 3 }]}>PassPay</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 12,
    letterSpacing: -0.5,
  },
});
