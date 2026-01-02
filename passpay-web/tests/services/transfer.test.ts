import { describe, it, expect } from "vitest";
import {
  validateAddress,
  isValidSolanaAddress,
  validateAmount,
  truncateAddress,
} from "@/lib/services/transfer";

describe("Transfer Service", () => {
  describe("validateAddress", () => {
    it("should validate a correct Solana address", () => {
      const validAddress = "11111111111111111111111111111111";
      const result = validateAddress(validAddress);
      expect(result).not.toBeNull();
      expect(result?.toBase58()).toBe(validAddress);
    });

    it("should return null for invalid address", () => {
      const invalidAddress = "not-a-valid-address";
      const result = validateAddress(invalidAddress);
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = validateAddress("");
      expect(result).toBeNull();
    });
  });

  describe("isValidSolanaAddress", () => {
    it("should return true for valid address", () => {
      const validAddress = "11111111111111111111111111111111";
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });

    it("should return false for invalid address", () => {
      expect(isValidSolanaAddress("invalid")).toBe(false);
      expect(isValidSolanaAddress("")).toBe(false);
      expect(isValidSolanaAddress("123")).toBe(false);
    });
  });

  describe("validateAmount", () => {
    it("should validate correct amounts", () => {
      expect(validateAmount("1.5")).toBe(1.5);
      expect(validateAmount("0.001")).toBe(0.001);
      expect(validateAmount("100")).toBe(100);
    });

    it("should return null for invalid amounts", () => {
      expect(validateAmount("0")).toBeNull();
      expect(validateAmount("-1")).toBeNull();
      expect(validateAmount("abc")).toBeNull();
      expect(validateAmount("")).toBeNull();
    });

    it("should respect minimum amount", () => {
      expect(validateAmount("0.5", 1)).toBeNull();
      expect(validateAmount("1", 1)).toBeNull();
      expect(validateAmount("1.1", 1)).toBe(1.1);
    });
  });

  describe("truncateAddress", () => {
    it("should truncate a Solana address", () => {
      const address = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";
      const truncated = truncateAddress(address);
      expect(truncated).toMatch(/^.{4}\.\.\..{4}$/);
    });

    it("should handle custom lengths", () => {
      const address = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";
      const truncated = truncateAddress(address, 8);
      expect(truncated).toBe("55czFRi1...F1cZPLFx");
    });

    it("should return original if shorter than truncation", () => {
      const shortAddress = "123456";
      expect(truncateAddress(shortAddress, 10)).toBe(shortAddress);
    });
  });
});
