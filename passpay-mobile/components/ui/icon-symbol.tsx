// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",

  // Wallet & Finance
  "wallet.pass.fill": "account-balance-wallet",
  "creditcard.fill": "credit-card",
  "banknote.fill": "payments",

  // Transfer & Send
  "paperplane.fill": "send",
  "arrow.up.circle.fill": "arrow-upward",
  "arrow.down.circle.fill": "arrow-downward",
  "arrow.left.arrow.right": "swap-horiz",
  "arrow.up.arrow.down": "swap-vert",

  // Memo & Notes
  "note.text": "description",
  "doc.text.fill": "article",
  "pencil.circle.fill": "edit",
  "text.bubble.fill": "chat",

  // Staking & Charts
  "chart.line.uptrend.xyaxis": "trending-up",
  "chart.bar.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  percent: "percent",

  // Actions
  qrcode: "qr-code-2",
  "qrcode.viewfinder": "qr-code-scanner",
  "doc.on.doc": "content-copy",
  "square.and.arrow.up": "share",
  "gearshape.fill": "settings",

  // Status
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "exclamationmark.triangle.fill": "warning",
  "info.circle.fill": "info",

  // Misc
  "person.fill": "person",
  "person.circle.fill": "account-circle",
  "clock.fill": "schedule",
  "star.fill": "star",
  "bell.fill": "notifications",
  "lock.fill": "lock",
  "key.fill": "vpn-key",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  magnifyingglass: "search",
  xmark: "close",
  ellipsis: "more-horiz",
  "ellipsis.vertical": "more-vert",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
