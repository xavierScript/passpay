/**
 * Tests for useTransactionHistory hook
 */

import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { act, renderHook } from "@testing-library/react-native";

// Mock Linking
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

describe("Hooks - useTransactionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty history", () => {
    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.history).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
  });

  it("should add a transaction to history", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig123", {
        amount: 1.5,
        recipient: "addr123",
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].signature).toBe("sig123");
    expect(result.current.history[0].data).toEqual({
      amount: 1.5,
      recipient: "addr123",
    });
    expect(result.current.isEmpty).toBe(false);
  });

  it("should add multiple transactions with newest first", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
      result.current.addTransaction("sig3", { amount: 3 });
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].signature).toBe("sig3");
    expect(result.current.history[1].signature).toBe("sig2");
    expect(result.current.history[2].signature).toBe("sig1");
  });

  it("should respect maxItems limit", () => {
    const { result } = renderHook(() => useTransactionHistory({ maxItems: 2 }));

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
      result.current.addTransaction("sig3", { amount: 3 });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].signature).toBe("sig3");
    expect(result.current.history[1].signature).toBe("sig2");
  });

  it("should clear all history", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(result.current.isEmpty).toBe(true);
  });

  it("should remove a specific item by id", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
    });

    const itemIdToRemove = result.current.history[0].id;

    act(() => {
      result.current.removeItem(itemIdToRemove);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].signature).toBe("sig1");
  });

  it("should generate correct explorer URL for devnet", () => {
    const { result } = renderHook(() =>
      useTransactionHistory({ cluster: "devnet" })
    );

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    expect(result.current.history[0].explorerUrl).toBe(
      "https://explorer.solana.com/tx/sig123?cluster=devnet"
    );
  });

  it("should generate correct explorer URL for mainnet", () => {
    const { result } = renderHook(() =>
      useTransactionHistory({ cluster: "mainnet" })
    );

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    expect(result.current.history[0].explorerUrl).toBe(
      "https://explorer.solana.com/tx/sig123"
    );
  });

  it("should include timestamp and formatted time", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    const item = result.current.history[0];
    expect(item.timestamp).toBeInstanceOf(Date);
    expect(item.formattedTime).toBeTruthy();
    expect(typeof item.formattedTime).toBe("string");
  });

  it("should generate unique IDs for each transaction", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
    });

    // Small delay to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    act(() => {
      result.current.addTransaction("sig1", { amount: 2 });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).not.toBe(result.current.history[1].id);
  });
});
