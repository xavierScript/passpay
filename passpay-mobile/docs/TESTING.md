# 🧪 Testing Guide

Comprehensive guide to testing LazorKit integrations in your React Native app.

---

## Table of Contents

- [Testing Setup](#testing-setup)
- [Running Tests](#running-tests)
- [Unit Testing](#unit-testing)
- [Mocking LazorKit](#mocking-lazorkit)
- [Testing Hooks](#testing-hooks)
- [Testing Services](#testing-services)
- [Integration Testing](#integration-testing)
- [Test Coverage](#test-coverage)

---

## Testing Setup

### Dependencies

```bash
npm install --save-dev \
  jest \
  jest-expo \
  @testing-library/react-native \
  @types/jest \
  --legacy-peer-deps
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: "jest-expo",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "(jest-)?react-native|" +
      "@react-native(-community)?|" +
      "expo(nent)?|" +
      "@expo(nent)?/.*|" +
      "@expo-google-fonts/.*|" +
      "react-navigation|" +
      "@react-navigation/.*|" +
      "@lazorkit/.*|" +
      "@solana/.*" +
      ")/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "hooks/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
};
```

### Setup File

Create `jest.setup.js`:

```javascript
// Mock React Native modules
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
}));

// Mock LazorKit SDK
jest.mock("@lazorkit/wallet-mobile-adapter", () => ({
  LazorKitProvider: ({ children }) => children,
  useWallet: jest.fn(() => ({
    smartWalletPubkey: null,
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signAndSendTransaction: jest.fn(),
  })),
}));

// Global mocks for Expo
global.__ExpoImportMetaRegistry = {};
global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default"
  }
}
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Single File

```bash
npm test -- helpers.test.ts
```

### With Coverage

```bash
npm run test:coverage
```

---

## Unit Testing

### Testing Utility Functions

```typescript
// __tests__/utils/helpers.test.ts
import {
  truncateAddress,
  formatSol,
  isValidAddress,
  getExplorerUrl,
} from "@/utils/helpers";

describe("Helper Functions", () => {
  describe("truncateAddress", () => {
    it("should truncate address correctly", () => {
      const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const result = truncateAddress(address);

      expect(result).toBe("7xKX...sAsU");
      expect(result.length).toBeLessThan(address.length);
    });

    it("should handle custom character count", () => {
      const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const result = truncateAddress(address, 6);

      expect(result).toBe("7xKXtg...osgAsU");
    });

    it("should return empty string for empty input", () => {
      expect(truncateAddress("")).toBe("");
    });

    it("should return original if shorter than truncation", () => {
      expect(truncateAddress("short")).toBe("short");
    });
  });

  describe("formatSol", () => {
    it("should format lamports to SOL", () => {
      expect(formatSol(1_000_000_000)).toBe("1.0000");
      expect(formatSol(500_000_000)).toBe("0.5000");
      expect(formatSol(1_234_567_890)).toBe("1.2346");
    });

    it("should handle zero", () => {
      expect(formatSol(0)).toBe("0.0000");
    });

    it("should handle custom decimals", () => {
      expect(formatSol(1_234_567_890, 2)).toBe("1.23");
    });
  });

  describe("isValidAddress", () => {
    it("should validate correct addresses", () => {
      const validAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      expect(isValidAddress(validAddress)).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(isValidAddress("not-valid")).toBe(false);
      expect(isValidAddress("")).toBe(false);
      expect(isValidAddress("0xabc123")).toBe(false); // Ethereum format
    });
  });

  describe("getExplorerUrl", () => {
    it("should generate devnet URL", () => {
      const sig = "5wHu1qwD7q4kA...";
      const url = getExplorerUrl(sig, "devnet");

      expect(url).toContain("explorer.solana.com");
      expect(url).toContain(sig);
      expect(url).toContain("cluster=devnet");
    });

    it("should default to mainnet", () => {
      const url = getExplorerUrl("sig123");
      expect(url).not.toContain("cluster=");
    });
  });
});
```

---

## Mocking LazorKit

### Basic Mock

```typescript
// __mocks__/lazorkit.ts
import { PublicKey } from "@solana/web3.js";

export const mockWallet = {
  smartWalletPubkey: null as PublicKey | null,
  isConnecting: false,
  connect: jest.fn(),
  disconnect: jest.fn(),
  signAndSendTransaction: jest.fn(),
};

export const useWallet = jest.fn(() => mockWallet);

export const LazorKitProvider = ({ children }: any) => children;
```

### Connected State Mock

```typescript
// In your test file
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { PublicKey } from "@solana/web3.js";

const mockPublicKey = new PublicKey(
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
);

beforeEach(() => {
  (useWallet as jest.Mock).mockReturnValue({
    smartWalletPubkey: mockPublicKey,
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signAndSendTransaction: jest.fn().mockResolvedValue("mock-signature"),
  });
});
```

### Transaction Mock with Behavior

```typescript
const mockSignAndSend = jest.fn();

// Success case
mockSignAndSend.mockResolvedValueOnce("success-signature-123");

// Failure case
mockSignAndSend.mockRejectedValueOnce(new Error("Transaction failed"));

(useWallet as jest.Mock).mockReturnValue({
  smartWalletPubkey: mockPublicKey,
  signAndSendTransaction: mockSignAndSend,
});
```

---

## Testing Hooks

### Testing useLazorkitTransaction

```typescript
// __tests__/hooks/use-lazorkit-transaction.test.ts
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import { useLazorkitTransaction } from "@/hooks/use-lazorkit-transaction";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

jest.mock("@lazorkit/wallet-mobile-adapter");

const mockPublicKey = new PublicKey(
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
);
const mockSignature = "5wHu1qwD7q4kAaJ8XzV8rP9yQnr3dRgY7pV2bNkHc6Dm";

describe("useLazorkitTransaction", () => {
  const mockSignAndSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({
      smartWalletPubkey: mockPublicKey,
      signAndSendTransaction: mockSignAndSend,
    });
  });

  it("should initialize with correct defaults", () => {
    const { result } = renderHook(() => useLazorkitTransaction());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe("function");
  });

  it("should execute transaction successfully", async () => {
    mockSignAndSend.mockResolvedValueOnce(mockSignature);
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useLazorkitTransaction({ onSuccess }));

    const instruction = SystemProgram.transfer({
      fromPubkey: mockPublicKey,
      toPubkey: mockPublicKey,
      lamports: LAMPORTS_PER_SOL * 0.01,
    });

    let signature: string | null = null;

    await act(async () => {
      signature = await result.current.execute({
        instructions: [instruction],
      });
    });

    expect(signature).toBe(mockSignature);
    expect(onSuccess).toHaveBeenCalledWith(mockSignature);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle transaction failure", async () => {
    const error = new Error("Transaction rejected");
    mockSignAndSend.mockRejectedValueOnce(error);
    const onError = jest.fn();

    const { result } = renderHook(() => useLazorkitTransaction({ onError }));

    const instruction = SystemProgram.transfer({
      fromPubkey: mockPublicKey,
      toPubkey: mockPublicKey,
      lamports: LAMPORTS_PER_SOL * 0.01,
    });

    await act(async () => {
      await result.current.execute({ instructions: [instruction] });
    });

    expect(result.current.error).toBe("Transaction rejected");
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("should set loading state during execution", async () => {
    let resolvePromise: (value: string) => void;
    mockSignAndSend.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() => useLazorkitTransaction());

    const instruction = SystemProgram.transfer({
      fromPubkey: mockPublicKey,
      toPubkey: mockPublicKey,
      lamports: 1000,
    });

    // Start execution
    let executePromise: Promise<string | null>;
    act(() => {
      executePromise = result.current.execute({ instructions: [instruction] });
    });

    // Loading should be true
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve and finish
    await act(async () => {
      resolvePromise!("signature");
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("should clear error state", async () => {
    mockSignAndSend.mockRejectedValueOnce(new Error("Failed"));

    const { result } = renderHook(() => useLazorkitTransaction());

    await act(async () => {
      await result.current.execute({
        instructions: [
          SystemProgram.transfer({
            fromPubkey: mockPublicKey,
            toPubkey: mockPublicKey,
            lamports: 1000,
          }),
        ],
      });
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should pass gasless config to SDK", async () => {
    mockSignAndSend.mockResolvedValueOnce(mockSignature);

    const { result } = renderHook(() =>
      useLazorkitTransaction({
        gasless: true,
        paymasterUrl: "https://custom.paymaster.com",
      })
    );

    await act(async () => {
      await result.current.execute({
        instructions: [
          SystemProgram.transfer({
            fromPubkey: mockPublicKey,
            toPubkey: mockPublicKey,
            lamports: 1000,
          }),
        ],
      });
    });

    expect(mockSignAndSend).toHaveBeenCalledWith(
      expect.objectContaining({
        gasConfig: {
          type: "paymaster",
          paymasterUrl: "https://custom.paymaster.com",
        },
      })
    );
  });
});
```

### Testing useTransactionHistory

```typescript
// __tests__/hooks/use-transaction-history.test.ts
import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTransactionHistory } from "@/hooks/use-transaction-history";

jest.mock("@react-native-async-storage/async-storage");

describe("useTransactionHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("should initialize with empty history", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history).toEqual([]);
  });

  it("should load existing history from storage", async () => {
    const existingHistory = [
      { id: "1", type: "transfer", signature: "sig1", timestamp: 1000 },
      { id: "2", type: "stake", signature: "sig2", timestamp: 2000 },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(existingHistory)
    );

    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toHaveLength(2);
    });

    expect(result.current.history[0].type).toBe("transfer");
  });

  it("should add transaction to history", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addTransaction({
        type: "transfer",
        signature: "new-sig-123",
        amount: 0.5,
        recipient: "7xKX...",
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].signature).toBe("new-sig-123");
    expect(result.current.history[0].amount).toBe(0.5);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("should clear history", async () => {
    const existingHistory = [
      { id: "1", type: "transfer", signature: "sig1", timestamp: 1000 },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(existingHistory)
    );

    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it("should generate correct explorer URLs", async () => {
    const { result } = renderHook(() => useTransactionHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const url = result.current.getExplorerUrl("test-signature");

    expect(url).toContain("explorer.solana.com");
    expect(url).toContain("test-signature");
  });
});
```

---

## Testing Services

### Testing Transfer Service

```typescript
// __tests__/services/transfer.test.ts
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  createTransferInstruction,
  isValidSolanaAddress,
  solToLamports,
  lamportsToSol,
} from "@/services/transfer";

describe("Transfer Service", () => {
  const validPubkey = new PublicKey(
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
  );

  describe("createTransferInstruction", () => {
    it("should create valid transfer instruction", () => {
      const from = validPubkey;
      const to = new PublicKey("HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH");
      const lamports = LAMPORTS_PER_SOL;

      const ix = createTransferInstruction(from, to, lamports);

      expect(ix.programId.toBase58()).toBe("11111111111111111111111111111111");
      expect(ix.keys).toHaveLength(2);
      expect(ix.keys[0].pubkey.equals(from)).toBe(true);
      expect(ix.keys[1].pubkey.equals(to)).toBe(true);
    });
  });

  describe("isValidSolanaAddress", () => {
    it("should return true for valid addresses", () => {
      expect(isValidSolanaAddress(validPubkey.toBase58())).toBe(true);
    });

    it("should return false for invalid addresses", () => {
      expect(isValidSolanaAddress("invalid")).toBe(false);
      expect(isValidSolanaAddress("")).toBe(false);
      expect(isValidSolanaAddress("0x123")).toBe(false);
    });
  });

  describe("solToLamports", () => {
    it("should convert correctly", () => {
      expect(solToLamports(1)).toBe(LAMPORTS_PER_SOL);
      expect(solToLamports(0.5)).toBe(LAMPORTS_PER_SOL / 2);
      expect(solToLamports(0)).toBe(0);
    });
  });

  describe("lamportsToSol", () => {
    it("should convert correctly", () => {
      expect(lamportsToSol(LAMPORTS_PER_SOL)).toBe(1);
      expect(lamportsToSol(LAMPORTS_PER_SOL / 2)).toBe(0.5);
      expect(lamportsToSol(0)).toBe(0);
    });
  });
});
```

### Testing RPC Service

```typescript
// __tests__/services/rpc.test.ts
import { Connection } from "@solana/web3.js";
import { getConnection, DEVNET_RPC } from "@/services/rpc";

jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    getRecentBlockhash: jest.fn(),
  })),
}));

describe("RPC Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create connection with devnet endpoint", () => {
    const connection = getConnection();

    expect(Connection).toHaveBeenCalledWith(
      DEVNET_RPC,
      expect.objectContaining({ commitment: "confirmed" })
    );
  });

  it("should return same instance (singleton)", () => {
    const conn1 = getConnection();
    const conn2 = getConnection();

    expect(conn1).toBe(conn2);
    expect(Connection).toHaveBeenCalledTimes(1);
  });

  it("should export correct devnet URL", () => {
    expect(DEVNET_RPC).toBe("https://api.devnet.solana.com");
  });
});
```

---

## Integration Testing

### Testing Screen Components

```typescript
// __tests__/screens/transfer.test.tsx
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useWallet } from "@lazorkit/wallet-mobile-adapter";
import TransferScreen from "@/app/(tabs)/transfer";
import { PublicKey } from "@solana/web3.js";

jest.mock("@lazorkit/wallet-mobile-adapter");

const mockPublicKey = new PublicKey(
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
);

describe("TransferScreen", () => {
  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue({
      smartWalletPubkey: mockPublicKey,
      signAndSendTransaction: jest.fn().mockResolvedValue("mock-sig"),
    });
  });

  it("should render transfer form", () => {
    const { getByPlaceholderText, getByText } = render(<TransferScreen />);

    expect(getByPlaceholderText("Recipient Address")).toBeTruthy();
    expect(getByPlaceholderText("Amount (SOL)")).toBeTruthy();
    expect(getByText("Send SOL")).toBeTruthy();
  });

  it("should validate recipient address", async () => {
    const { getByPlaceholderText, getByText } = render(<TransferScreen />);

    fireEvent.changeText(getByPlaceholderText("Recipient Address"), "invalid");
    fireEvent.changeText(getByPlaceholderText("Amount (SOL)"), "0.1");
    fireEvent.press(getByText("Send SOL"));

    await waitFor(() => {
      expect(getByText(/invalid address/i)).toBeTruthy();
    });
  });

  it("should show not connected view when disconnected", () => {
    (useWallet as jest.Mock).mockReturnValue({
      smartWalletPubkey: null,
      signAndSendTransaction: jest.fn(),
    });

    const { getByText } = render(<TransferScreen />);

    expect(getByText(/connect.*wallet/i)).toBeTruthy();
  });
});
```

---

## Test Coverage

### Generating Coverage Report

```bash
npm run test:coverage
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  // ... other config
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Viewing Coverage Report

```bash
# Open in browser
open coverage/lcov-report/index.html
```

---

## Best Practices

### 1. Test Naming Convention

```typescript
describe("ComponentName", () => {
  describe("methodName", () => {
    it("should [expected behavior] when [condition]", () => {
      // ...
    });
  });
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it("should add transaction to history", async () => {
  // Arrange
  const { result } = renderHook(() => useTransactionHistory());

  // Act
  await act(async () => {
    await result.current.addTransaction({
      /* ... */
    });
  });

  // Assert
  expect(result.current.history).toHaveLength(1);
});
```

### 3. Mock Only What You Need

```typescript
// ❌ BAD: Mocking too much
jest.mock("@solana/web3.js");

// ✅ GOOD: Specific mocks
jest.mock("@solana/web3.js", () => ({
  ...jest.requireActual("@solana/web3.js"),
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
  })),
}));
```

### 4. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
