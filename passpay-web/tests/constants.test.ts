import { describe, it, expect } from "vitest";
import { PLANS, USDC_MINT, RECIPIENT_WALLET } from "@/lib/constants";

describe("Constants", () => {
  describe("PLANS", () => {
    it("should have 3 subscription plans", () => {
      expect(PLANS).toHaveLength(3);
    });

    it("should have correct plan structure", () => {
      PLANS.forEach((plan) => {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("amount");
        expect(typeof plan.id).toBe("string");
        expect(typeof plan.name).toBe("string");
        expect(typeof plan.amount).toBe("number");
      });
    });

    it("should have plans in ascending price order", () => {
      expect(PLANS[0].amount).toBeLessThan(PLANS[1].amount);
      expect(PLANS[1].amount).toBeLessThan(PLANS[2].amount);
    });

    it("should have correct plan IDs", () => {
      const ids = PLANS.map((p) => p.id);
      expect(ids).toContain("basic");
      expect(ids).toContain("pro");
      expect(ids).toContain("premium");
    });

    it("should have positive amounts", () => {
      PLANS.forEach((plan) => {
        expect(plan.amount).toBeGreaterThan(0);
      });
    });
  });

  describe("USDC_MINT", () => {
    it("should be a valid Solana address", () => {
      expect(USDC_MINT).toBeDefined();
      expect(typeof USDC_MINT).toBe("string");
      expect(USDC_MINT.length).toBeGreaterThan(32);
    });
  });

  describe("RECIPIENT_WALLET", () => {
    it("should be a valid Solana address", () => {
      expect(RECIPIENT_WALLET).toBeDefined();
      expect(typeof RECIPIENT_WALLET).toBe("string");
      expect(RECIPIENT_WALLET.length).toBeGreaterThan(32);
    });
  });
});
