import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveSubscription,
  getSubscription,
  hasActiveSubscription,
  getActiveSubscription,
  getDaysRemaining,
  clearAllSubscriptions,
} from "@/lib/services/subscription";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("Subscription Service", () => {
  const testWallet = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";

  beforeEach(() => {
    clearAllSubscriptions();
  });

  describe("saveSubscription", () => {
    it("should save a new subscription", () => {
      const subscription = saveSubscription(
        testWallet,
        "Premium",
        0.1,
        "test-signature-123"
      );

      expect(subscription.wallet).toBe(testWallet);
      expect(subscription.plan).toBe("Premium");
      expect(subscription.amount).toBe(0.1);
      expect(subscription.signature).toBe("test-signature-123");
      expect(subscription.subscribedAt).toBeDefined();
      expect(subscription.expiresAt).toBeDefined();
    });

    it("should set expiry date 30 days from now", () => {
      const subscription = saveSubscription(testWallet, "Basic", 0.01, "sig1");

      const subscribedDate = new Date(subscription.subscribedAt);
      const expiryDate = new Date(subscription.expiresAt);
      const diffDays = Math.round(
        (expiryDate.getTime() - subscribedDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBe(30);
    });
  });

  describe("getSubscription", () => {
    it("should retrieve saved subscription", () => {
      saveSubscription(testWallet, "Pro", 0.05, "sig2");
      const subscription = getSubscription(testWallet);

      expect(subscription).not.toBeNull();
      expect(subscription?.plan).toBe("Pro");
      expect(subscription?.amount).toBe(0.05);
    });

    it("should return null for non-existent subscription", () => {
      const subscription = getSubscription("non-existent-wallet");
      expect(subscription).toBeNull();
    });
  });

  describe("hasActiveSubscription", () => {
    it("should return true for active subscription", () => {
      saveSubscription(testWallet, "Premium", 0.1, "sig3");
      expect(hasActiveSubscription(testWallet)).toBe(true);
    });

    it("should return false for expired subscription", () => {
      const sub = saveSubscription(testWallet, "Basic", 0.01, "sig4");

      // Manually set expiry to past
      const subscriptions = JSON.parse(
        localStorage.getItem("passpay_subscriptions") || "{}"
      );
      subscriptions[testWallet].expiresAt = new Date(
        Date.now() - 1000
      ).toISOString();
      localStorage.setItem(
        "passpay_subscriptions",
        JSON.stringify(subscriptions)
      );

      expect(hasActiveSubscription(testWallet)).toBe(false);
    });

    it("should return false for non-existent wallet", () => {
      expect(hasActiveSubscription("unknown-wallet")).toBe(false);
    });
  });

  describe("getActiveSubscription", () => {
    it("should return subscription if active", () => {
      saveSubscription(testWallet, "Pro", 0.05, "sig5");
      const activeSub = getActiveSubscription(testWallet);

      expect(activeSub).not.toBeNull();
      expect(activeSub?.plan).toBe("Pro");
    });

    it("should return null if expired", () => {
      saveSubscription(testWallet, "Basic", 0.01, "sig6");

      // Set expiry to past
      const subscriptions = JSON.parse(
        localStorage.getItem("passpay_subscriptions") || "{}"
      );
      subscriptions[testWallet].expiresAt = new Date(
        Date.now() - 1000
      ).toISOString();
      localStorage.setItem(
        "passpay_subscriptions",
        JSON.stringify(subscriptions)
      );

      expect(getActiveSubscription(testWallet)).toBeNull();
    });
  });

  describe("getDaysRemaining", () => {
    it("should calculate days remaining correctly", () => {
      saveSubscription(testWallet, "Premium", 0.1, "sig7");
      const days = getDaysRemaining(testWallet);

      expect(days).toBeGreaterThan(29);
      expect(days).toBeLessThanOrEqual(30);
    });

    it("should return 0 for expired subscription", () => {
      saveSubscription(testWallet, "Basic", 0.01, "sig8");

      // Set expiry to past
      const subscriptions = JSON.parse(
        localStorage.getItem("passpay_subscriptions") || "{}"
      );
      subscriptions[testWallet].expiresAt = new Date(
        Date.now() - 1000
      ).toISOString();
      localStorage.setItem(
        "passpay_subscriptions",
        JSON.stringify(subscriptions)
      );

      expect(getDaysRemaining(testWallet)).toBe(0);
    });

    it("should return 0 for non-existent subscription", () => {
      expect(getDaysRemaining("unknown-wallet")).toBe(0);
    });
  });

  describe("clearAllSubscriptions", () => {
    it("should remove all subscriptions", () => {
      saveSubscription(testWallet, "Premium", 0.1, "sig9");
      saveSubscription("wallet2", "Basic", 0.01, "sig10");

      expect(getSubscription(testWallet)).not.toBeNull();
      expect(getSubscription("wallet2")).not.toBeNull();

      clearAllSubscriptions();

      expect(getSubscription(testWallet)).toBeNull();
      expect(getSubscription("wallet2")).toBeNull();
    });
  });
});
