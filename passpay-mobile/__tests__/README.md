# Tests

This directory contains the test suite for the PassPay mobile application.

## Setup

The project uses:

- **Jest** - Testing framework
- **@testing-library/react-native** - React Native testing utilities
- **jest-expo** - Expo preset for Jest

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── utils/           # Tests for utility functions
├── services/        # Tests for service modules
└── hooks/           # Tests for custom React hooks
```

## Test Coverage

Current test files:

### Utils Tests

- `helpers.test.ts` - Tests for Solana address validation, truncation, and explorer URL generation

### Services Tests

- `rpc.test.ts` - Tests for RPC connection management and singleton pattern

### Hooks Tests

- `use-transaction-history.test.ts` - Tests for transaction history management hook

## Writing New Tests

When adding new tests:

1. Create test files with `.test.ts` or `.test.tsx` extension
2. Place tests in the appropriate subdirectory
3. Follow the existing test structure and naming conventions
4. Mock external dependencies when necessary

### Example Test Template

```typescript
import { functionToTest } from "@/path/to/module";

describe("Module Name", () => {
  describe("functionToTest", () => {
    it("should do something", () => {
      const result = functionToTest();
      expect(result).toBe(expectedValue);
    });
  });
});
```

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline by running `npm test` in your build process.
