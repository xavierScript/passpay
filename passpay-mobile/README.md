# PassPay

**Passkey-powered Solana wallet for React Native**

A starter template demonstrating [LazorKit SDK](https://docs.lazorkit.com/) integration for biometric Solana wallets with gasless transactions.

---

## ✨ Features

| Feature                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| 🔐 **Passkey Wallet**    | Create wallets with FaceID/TouchID—no seed phrases |
| 💸 **Gasless Transfers** | Send SOL without paying gas fees                   |
| 📝 **On-Chain Memos**    | Write permanent messages on Solana                 |
| 🥩 **SOL Staking**       | Stake to validators with biometric auth            |

---

## 🚀 Quick Start

```bash
# Install
npm install --legacy-peer-deps

# Run
npx expo start
```

> **Requirements:** Node 18+, Expo CLI, iOS Simulator or Android Emulator

---

## 📚 Tutorials

Step-by-step guides for every feature:

| #   | Tutorial                                                            | Description                        |
| --- | ------------------------------------------------------------------- | ---------------------------------- |
| 1   | [Passkey Wallet](./docs/tutorials/01-PASSKEY_WALLET.md)             | Connect wallets with biometrics    |
| 2   | [Gasless Transactions](./docs/tutorials/02-GASLESS_TRANSACTIONS.md) | Paymaster-sponsored transfers      |
| 3   | [SOL Staking](./docs/tutorials/03-SOL_STAKING.md)                   | Multi-instruction staking          |
| 4   | [On-Chain Memos](./docs/tutorials/04-ON_CHAIN_MEMOS.md)             | Permanent blockchain messages      |
| 5   | [Session Management](./docs/tutorials/05-SESSION_MANAGEMENT.md)     | Persist sessions with AsyncStorage |

---

## 📖 Documentation

| Document                                     | Description                   |
| -------------------------------------------- | ----------------------------- |
| [Quick Start](./docs/QUICK_START.md)         | 5-minute setup guide          |
| [Installation](./docs/INSTALLATION.md)       | Detailed setup with polyfills |
| [Architecture](./docs/ARCHITECTURE.md)       | Project structure & design    |
| [API Reference](./docs/API_REFERENCE.md)     | Hooks, services & utilities   |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues & solutions     |
| [Testing](./docs/TESTING.md)                 | Testing guide with examples   |
| [Deployment](./docs/DEPLOYMENT.md)           | App Store & Play Store guide  |

---

## 📱 App Structure

```
app/
├── (tabs)/
│   ├── index.tsx      # Wallet connection
│   ├── transfer.tsx   # Gasless transfers
│   ├── memo.tsx       # On-chain memos
│   └── stake.tsx      # SOL staking
hooks/                 # Custom React hooks
services/              # Business logic
utils/                 # Helper functions
```

---

## 🔧 Configuration

**Devnet (default):**

```typescript
{
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterUrl: "https://kora.devnet.lazorkit.com",
}
```

**Deep linking:** `passpaymobile://`

---

## 🔗 Resources

- [LazorKit Docs](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/phasewalk1/lazorkit)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

---

## 📄 License

MIT

---

