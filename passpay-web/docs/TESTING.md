# 🧪 Testing Guide

Comprehensive guide to testing LazorKit integrations in your Next.js app.

---

## Table of Contents

- [Testing Setup](#testing-setup)
- [Running Tests](#running-tests)
- [Unit Testing](#unit-testing)
- [Mocking LazorKit](#mocking-lazorkit)
- [Testing Hooks](#testing-hooks)
- [Testing Services](#testing-services)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Test Coverage](#test-coverage)

---

## Testing Setup

### Install Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["hooks/**", "lib/**"],
      exclude: ["**/*.d.ts", "**/*.test.*"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### Setup File

Create `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.Buffer
global.Buffer = Buffer;

// Mock toast notifications
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock LazorKit SDK
vi.mock("@lazorkit/wallet", () => ({
  LazorkitProvider: ({ children }: { children: React.ReactNode }) => children,
  useWallet: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: false,
    isConnecting: false,
    wallet: null,
    smartWalletPubkey: null,
    signAndSendTransaction: vi.fn(),
  })),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
}));
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
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
npm test -- constants.test.ts
```

### With Coverage

```bash
npm run test:coverage
```

### With UI

```bash
npm run test:ui
```

---

## Unit Testing

### Testing Utility Functions

```typescript
// tests/constants.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, PLANS, USDC_MINT } from "@/lib/constants";

describe("Constants", () => {
  describe("DEFAULT_CONFIG", () => {
    it("should have valid RPC URL", () => {
      expect(DEFAULT_CONFIG.rpcUrl).toMatch(/^https:\/\//);
    });

    it("should have portal URL", () => {
      expect(DEFAULT_CONFIG.portalUrl).toBe("https://portal.lazor.sh");
    });

    it("should have paymaster config", () => {
      expect(DEFAULT_CONFIG.paymasterConfig).toBeDefined();
      expect(DEFAULT_CONFIG.paymasterConfig.paymasterUrl).toMatch(/lazorkit/);
    });
  });

  describe("PLANS", () => {
    it("should have at least one plan", () => {
      expect(PLANS.length).toBeGreaterThan(0);
    });

    it("should have valid plan structure", () => {
      PLANS.forEach((plan) => {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("amount");
        expect(typeof plan.amount).toBe("number");
        expect(plan.amount).toBeGreaterThan(0);
      });
    });
  });

  describe("USDC_MINT", () => {
    it("should be a valid base58 string", () => {
      expect(USDC_MINT).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    });
  });
});
```

### Testing Service Functions

```typescript
// tests/services/transfer.test.ts
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  validateAddress,
  validateAmount,
  createTransferInstruction,
  truncateAddress,
} from "@/lib/services/transfer";

describe("Transfer Service", () => {
  describe("validateAddress", () => {
    it("should return PublicKey for valid address", () => {
      const validAddress = "11111111111111111111111111111111";
      const result = validateAddress(validAddress);
      expect(result).toBeInstanceOf(PublicKey);
    });

    it("should return null for invalid address", () => {
      expect(validateAddress("invalid")).toBeNull();
      expect(validateAddress("")).toBeNull();
      expect(validateAddress("0x123")).toBeNull();
    });
  });

  describe("validateAmount", () => {
    it("should return number for valid amount", () => {
      expect(validateAmount("1.5")).toBe(1.5);
      expect(validateAmount("0.001")).toBe(0.001);
      expect(validateAmount("100")).toBe(100);
    });

    it("should return null for invalid amount", () => {
      expect(validateAmount("")).toBeNull();
      expect(validateAmount("abc")).toBeNull();
      expect(validateAmount("-1")).toBeNull();
      expect(validateAmount("0")).toBeNull();
    });

    it("should respect minimum amount", () => {
      expect(validateAmount("0.5", 1)).toBeNull();
      expect(validateAmount("1.5", 1)).toBe(1.5);
    });
  });

  describe("createTransferInstruction", () => {
    it("should create valid instruction", () => {
      const from = new PublicKey("11111111111111111111111111111111");
      const to = new PublicKey("22222222222222222222222222222222");
      const instruction = createTransferInstruction(from, to, 1.0);

      expect(instruction).toBeDefined();
      expect(instruction.programId.toBase58()).toBe(
        "11111111111111111111111111111111"
      );
    });
  });

  describe("truncateAddress", () => {
    it("should truncate long addresses", () => {
      const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      expect(truncateAddress(address)).toBe("7xKX...sAsU");
    });

    it("should handle custom character count", () => {
      const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      expect(truncateAddress(address, 6)).toBe("7xKXtg...gAsU");
    });

    it("should return short addresses unchanged", () => {
      expect(truncateAddress("short")).toBe("short");
    });
  });
});
```

---

## Mocking LazorKit

### Basic Mock

```typescript
// tests/mocks/lazorkit.ts
import { vi } from "vitest";
import { PublicKey } from "@solana/web3.js";

export const mockWallet = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: false,
  isConnecting: false,
  wallet: null,
  smartWalletPubkey: null,
  signAndSendTransaction: vi.fn(),
};

export const createConnectedMock = (address: string) => ({
  ...mockWallet,
  isConnected: true,
  wallet: { smartWallet: address },
  smartWalletPubkey: new PublicKey(address),
  signAndSendTransaction: vi.fn().mockResolvedValue("mock-signature"),
});
```

### Using in Tests

```typescript
import { vi } from "vitest";
import { useWallet } from "@lazorkit/wallet";
import { createConnectedMock } from "./mocks/lazorkit";

vi.mock("@lazorkit/wallet");

describe("Transfer Hook", () => {
  beforeEach(() => {
    const mockAddress = "11111111111111111111111111111111";
    vi.mocked(useWallet).mockReturnValue(createConnectedMock(mockAddress));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ... tests
});
```

---

## Testing Hooks

### Testing Custom Hooks

```typescript
// tests/hooks/useSolBalance.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWallet } from "@lazorkit/wallet";
import { useSolBalance } from "@/hooks/useSolBalance";
import * as rpcService from "@/lib/services/rpc";

vi.mock("@lazorkit/wallet");
vi.mock("@/lib/services/rpc");

describe("useSolBalance", () => {
  const mockPubkey = { toBase58: () => "mock-address" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null balance when not connected", () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      smartWalletPubkey: null,
    } as any);

    const { result } = renderHook(() => useSolBalance());

    expect(result.current.balance).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("should fetch balance when connected", async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      smartWalletPubkey: mockPubkey,
    } as any);

    vi.mocked(rpcService.getSolBalance).mockResolvedValue(5.5);

    const { result } = renderHook(() => useSolBalance());

    await waitFor(() => {
      expect(result.current.balance).toBe(5.5);
    });
  });

  it("should handle fetch errors", async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      smartWalletPubkey: mockPubkey,
    } as any);

    vi.mocked(rpcService.getSolBalance).mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useSolBalance());

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
  });
});
```

---

## Testing Services

### Testing Memo Service

```typescript
// tests/services/memo.test.ts
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  createMemoInstruction,
  createUnsignedMemoInstruction,
  validateMemo,
  MEMO_PROGRAM_ID,
} from "@/lib/services/memo";

describe("Memo Service", () => {
  describe("MEMO_PROGRAM_ID", () => {
    it("should be correct program ID", () => {
      expect(MEMO_PROGRAM_ID.toBase58()).toBe(
        "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
      );
    });
  });

  describe("createMemoInstruction", () => {
    it("should create instruction with signer", () => {
      const signer = new PublicKey("11111111111111111111111111111111");
      const instruction = createMemoInstruction("Hello", signer);

      expect(instruction.programId).toEqual(MEMO_PROGRAM_ID);
      expect(instruction.keys).toHaveLength(1);
      expect(instruction.keys[0].isSigner).toBe(true);
      expect(instruction.data.toString()).toBe("Hello");
    });
  });

  describe("createUnsignedMemoInstruction", () => {
    it("should create instruction without signer", () => {
      const instruction = createUnsignedMemoInstruction("Hello");

      expect(instruction.programId).toEqual(MEMO_PROGRAM_ID);
      expect(instruction.keys).toHaveLength(0);
      expect(instruction.data.toString()).toBe("Hello");
    });
  });

  describe("validateMemo", () => {
    it("should return null for valid memo", () => {
      expect(validateMemo("Hello, Solana!")).toBeNull();
      expect(validateMemo("A")).toBeNull();
    });

    it("should return error for empty memo", () => {
      expect(validateMemo("")).toBe("Please enter a message");
      expect(validateMemo("   ")).toBe("Please enter a message");
    });

    it("should return error for too long memo", () => {
      const longMessage = "a".repeat(201);
      expect(validateMemo(longMessage)).toBe(
        "Message too long. Maximum 200 characters."
      );
    });
  });
});
```

---

## Integration Testing

### Testing Component Integration

```typescript
// tests/integration/transfer.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useWallet } from "@lazorkit/wallet";
import TransferPage from "@/app/(dashboard)/transfer/page";

vi.mock("@lazorkit/wallet");

describe("Transfer Page Integration", () => {
  beforeEach(() => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      smartWalletPubkey: { toBase58: () => "mock-address" },
      signAndSendTransaction: vi.fn().mockResolvedValue("mock-signature"),
    } as any);
  });

  it("should show transfer form when connected", () => {
    render(<TransferPage />);

    expect(screen.getByLabelText(/recipient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("should validate recipient address", async () => {
    render(<TransferPage />);

    const recipientInput = screen.getByLabelText(/recipient/i);
    fireEvent.change(recipientInput, { target: { value: "invalid" } });

    const submitButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid.*address/i)).toBeInTheDocument();
    });
  });
});
```

---

## E2E Testing

### Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/PassPay/);
  });

  test("should show connect button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /passkey/i })).toBeVisible();
  });
});
```

---

## Test Coverage

### Generate Coverage Report

```bash
npm run test:coverage
```

### Coverage Thresholds

Add to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### View Coverage Report

Coverage reports are generated in the `coverage/` directory:

- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI integration

---

## Best Practices

1. **Test behavior, not implementation** - Test what the code does, not how it does it
2. **Use meaningful test names** - Describe the expected behavior
3. **Keep tests independent** - Each test should run in isolation
4. **Mock external dependencies** - LazorKit, RPC, etc.
5. **Test edge cases** - Empty inputs, network errors, etc.
6. **Maintain test coverage** - Aim for 80%+ coverage on critical paths
