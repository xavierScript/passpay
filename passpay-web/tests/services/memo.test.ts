import { describe, it, expect } from "vitest";
import { validateMemo } from "@/lib/services/memo";

describe("Memo Service", () => {
  describe("validateMemo", () => {
    it("should accept valid memo messages", () => {
      expect(validateMemo("Hello, Solana!")).toBeNull();
      expect(validateMemo("Test memo message")).toBeNull();
      expect(validateMemo("A".repeat(200))).toBeNull();
    });

    it("should reject empty messages", () => {
      expect(validateMemo("")).toBe("Please enter a message");
      expect(validateMemo("   ")).toBe("Please enter a message");
      expect(validateMemo("\n\t")).toBe("Please enter a message");
    });

    it("should reject messages over 200 characters", () => {
      const longMessage = "A".repeat(201);
      expect(validateMemo(longMessage)).toBe(
        "Message too long. Maximum 200 characters."
      );
    });

    it("should accept exactly 200 characters", () => {
      const maxMessage = "X".repeat(200);
      expect(validateMemo(maxMessage)).toBeNull();
    });

    it("should handle special characters", () => {
      expect(validateMemo("🎉 Emoji test!")).toBeNull();
      expect(validateMemo("Special chars: @#$%^&*()")).toBeNull();
    });
  });
});
