// Polyfills for React Native
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

export const unstable_settings = {
  anchor: "(tabs)",
};

const LAZORKIT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  configPaymaster: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LazorKitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      configPaymaster={LAZORKIT_CONFIG.configPaymaster}
      isDebug={true}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </LazorKitProvider>
  );
}
