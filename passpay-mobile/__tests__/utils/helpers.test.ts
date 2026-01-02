/**
 * Tests for utility helper functions
 */

import {
  getAddressExplorerUrl,
  getExplorerUrl,
  isValidSolanaAddress,
  truncateAddress,
} from "@/utils/helpers";

describe("Utils - Helpers", () => {
  describe("isValidSolanaAddress", () => {
    it("should return true for a valid Solana address", () => {
      const validAddress = "11111111111111111111111111111111";
      expect(isValidSolanaAddress(validAddress)).toBe(true);
    });

    it("should return false for an invalid address", () => {
      const invalidAddress = "invalid-address";
      expect(isValidSolanaAddress(invalidAddress)).toBe(false);
    });

    it("should return false for an empty string", () => {
      expect(isValidSolanaAddress("")).toBe(false);
    });

    it("should return false for a malformed address", () => {
      const malformedAddress = "123";
      expect(isValidSolanaAddress(malformedAddress)).toBe(false);
    });
  });

  describe("truncateAddress", () => {
    it("should truncate a long address with default params", () => {
      const address = "4UjfJZ8K1234567890abcdefghijklmnopqrstuvwxyz";
      const result = truncateAddress(address);
      expect(result).toBe("4Ujf...wxyz");
    });

    it("should truncate with custom start and end chars", () => {
      const address = "4UjfJZ8K1234567890abcdefghijklmnopqrstuvwxyz";
      const result = truncateAddress(address, 6, 3);
      expect(result).toBe("4UjfJZ...xyz");
    });

    it("should return full address if shorter than truncation length", () => {
      const shortAddress = "12345678";
      const result = truncateAddress(shortAddress);
      expect(result).toBe("12345678");
    });

    it("should return empty string for empty input", () => {
      expect(truncateAddress("")).toBe("");
    });
  });

  describe("getExplorerUrl", () => {
    it("should generate devnet explorer URL with cluster param", () => {
      const signature = "5wHu1234567890";
      const url = getExplorerUrl(signature, "devnet");
      expect(url).toBe(
        "https://explorer.solana.com/tx/5wHu1234567890?cluster=devnet"
      );
    });

    it("should generate mainnet explorer URL without cluster param", () => {
      const signature = "5wHu1234567890";
      const url = getExplorerUrl(signature, "mainnet");
      expect(url).toBe("https://explorer.solana.com/tx/5wHu1234567890");
    });

    it("should use devnet as default cluster", () => {
      const signature = "5wHu1234567890";
      const url = getExplorerUrl(signature);
      expect(url).toBe(
        "https://explorer.solana.com/tx/5wHu1234567890?cluster=devnet"
      );
    });
  });

  describe("getAddressExplorerUrl", () => {
    it("should generate devnet address explorer URL", () => {
      const address = "4UjfJZ8K1234567890";
      const url = getAddressExplorerUrl(address, "devnet");
      expect(url).toBe(
        "https://explorer.solana.com/address/4UjfJZ8K1234567890?cluster=devnet"
      );
    });

    it("should generate mainnet address explorer URL", () => {
      const address = "4UjfJZ8K1234567890";
      const url = getAddressExplorerUrl(address, "mainnet");
      expect(url).toBe(
        "https://explorer.solana.com/address/4UjfJZ8K1234567890"
      );
    });

    it("should use devnet as default cluster", () => {
      const address = "4UjfJZ8K1234567890";
      const url = getAddressExplorerUrl(address);
      expect(url).toBe(
        "https://explorer.solana.com/address/4UjfJZ8K1234567890?cluster=devnet"
      );
    });
  });
});
