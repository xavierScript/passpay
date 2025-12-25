/**
 * Onboarding Layout
 */

import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-wallet" />
    </Stack>
  );
}
