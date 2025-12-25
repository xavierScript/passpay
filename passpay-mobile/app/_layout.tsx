/**
 * Root Layout with Polyfills and Lazorkit Provider
 * Must be the entry point to configure React Native environment
 */

// CRITICAL: Polyfills must be imported first
import { Buffer } from "buffer";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
global.Buffer = global.Buffer || Buffer;

import { LazorKitProvider } from "@lazorkit/wallet-mobile-adapter";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LAZORKIT_CONFIG, SOLANA_CONFIG } from "@/lib/constants";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LazorKitProvider
      rpcUrl={SOLANA_CONFIG.RPC_URL}
      portalUrl={LAZORKIT_CONFIG.PORTAL_URL}
      configPaymaster={{
        paymasterUrl: LAZORKIT_CONFIG.PAYMASTER_URL,
        apiKey: LAZORKIT_CONFIG.API_KEY,
      }}
      isDebug={__DEV__}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="send"
            options={{
              presentation: "modal",
              title: "Send USDC",
              headerStyle: { backgroundColor: "#000" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="scan-qr"
            options={{
              presentation: "modal",
              title: "Scan QR Code",
              headerStyle: { backgroundColor: "#000" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="transaction-success"
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </LazorKitProvider>
  );
}
