/**
 * Tests for useTransactionHistory hook
 */

import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { act, renderHook, waitFor } from "@testing-library/react-native";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Linking
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

describe("Hooks - useTransactionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty history", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  it("should add a transaction to history", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig123", {
        amount: 1.5,
        recipient: "addr123",
      });
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].signature).toBe("sig123");
      expect(result.current.history[0].data).toEqual({
        amount: 1.5,
        recipient: "addr123",
      });
      expect(result.current.isEmpty).toBe(false);
    });
  });

  it("should add multiple transactions with newest first", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
      result.current.addTransaction("sig3", { amount: 3 });
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(3);
      expect(result.current.history[0].signature).toBe("sig3");
      expect(result.current.history[1].signature).toBe("sig2");
      expect(result.current.history[2].signature).toBe("sig1");
    });
  });

  it("should respect maxItems limit", async () => {
    const { result } = renderHook(() => useTransactionHistory({ maxItems: 2 }));

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
      result.current.addTransaction("sig3", { amount: 3 });
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(2);
      expect(result.current.history[0].signature).toBe("sig3");
      expect(result.current.history[1].signature).toBe("sig2");
    });
  });

  it("should clear all history", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(2);
    });

    act(() => {
      result.current.clearHistory();
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(0);
      expect(result.current.isEmpty).toBe(true);
    });
  });

  it("should remove a specific item by id", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig1", { amount: 1 });
      result.current.addTransaction("sig2", { amount: 2 });
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(2);
    });

    const itemIdToRemove = result.current.history[0].id;

    act(() => {
      result.current.removeItem(itemIdToRemove);
    });

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].signature).toBe("sig1");
    });
  });

  it("should generate correct explorer URL for devnet", async () => {
    const { result } = renderHook(() =>
      useTransactionHistory({ cluster: "devnet" })
    );

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    await waitFor(() => {
      expect(result.current.history[0].explorerUrl).toBe(
        "https://explorer.solana.com/tx/sig123?cluster=devnet"
      );
    });
  });

  it("should generate correct explorer URL for mainnet", async () => {
    const { result } = renderHook(() =>
      useTransactionHistory({ cluster: "mainnet" })
    );

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    await waitFor(() => {
      expect(result.current.history[0].explorerUrl).toBe(
        "https://explorer.solana.com/tx/sig123"
      );
    });
  });

  it("should include timestamp and formatted time", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toEqual([]);
    });

    act(() => {
      result.current.addTransaction("sig123", { amount: 1 });
    });

    await waitFor(() => {
      const item = result.current.history[0];
      expect(item.timestamp).toBeInstanceOf(Date);
      expect(item.formattedTime).toBeTruthy();
      expect(typeof item.formattedTime).toBe("string");
    });
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
