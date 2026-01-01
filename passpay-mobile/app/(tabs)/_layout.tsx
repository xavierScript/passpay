import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.gray,
        tabBarStyle: {
          backgroundColor: AppColors.card,
          borderTopColor: AppColors.card,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="wallet.pass.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: "Transfer",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="arrow.up.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memo"
        options={{
          title: "Memo",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="note.text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stake"
        options={{
          title: "Stake",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="chart.line.uptrend.xyaxis"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
