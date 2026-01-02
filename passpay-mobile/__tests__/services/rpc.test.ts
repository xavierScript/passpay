/**
 * Tests for RPC service
 */

import { DEVNET_RPC, getConnection } from "@/services/rpc";

describe("Services - RPC", () => {
  describe("getConnection", () => {
    it("should return a Connection instance", () => {
      const connection = getConnection();
      expect(connection).toBeDefined();
      expect(connection.rpcEndpoint).toBe(DEVNET_RPC);
    });

    it("should return the same instance on multiple calls (singleton)", () => {
      const connection1 = getConnection();
      const connection2 = getConnection();
      expect(connection1).toBe(connection2);
    });

    it("should have correct commitment level", () => {
      const connection = getConnection();
      expect(connection.commitment).toBe("confirmed");
    });
  });

  describe("DEVNET_RPC", () => {
    it("should be a valid RPC URL", () => {
      expect(DEVNET_RPC).toBe("https://api.devnet.solana.com");
    });
  });
});
