/**
 * Development Helper Utilities
 *
 * Utilities to help test and debug the subscription system
 * Access these from the browser console:
 *
 * window.passpayDebug.clearSubscriptions()
 * window.passpayDebug.viewSubscriptions()
 */

import { clearAllSubscriptions } from "./services/subscription";

if (typeof window !== "undefined") {
  (window as any).passpayDebug = {
    clearSubscriptions: () => {
      clearAllSubscriptions();
      console.log("✅ All subscriptions cleared from localStorage");
      console.log("💡 Refresh the page to see changes");
    },
    viewSubscriptions: () => {
      const data = localStorage.getItem("passpay_subscriptions");
      if (!data) {
        console.log("📭 No subscriptions found");
        return;
      }
      console.log("📋 Current subscriptions:");
      console.table(JSON.parse(data));
    },
  };

  console.log(`
🔧 PassPay Debug Tools Available:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• passpayDebug.clearSubscriptions()
  Clear all subscription data

• passpayDebug.viewSubscriptions()
  View current subscription data
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}
