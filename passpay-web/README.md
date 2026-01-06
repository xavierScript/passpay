# PassPay Web

**Passkey-powered Solana wallet for Next.js**

A starter template demonstrating [LazorKit SDK](https://docs.lazorkit.com/) integration for biometric Solana wallets with gasless transactions and subscription payments.

---

## ✨ Features

| Feature                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| 🔐 **Passkey Wallet**        | Create wallets with biometrics—no seed phrases |
| 💸 **Gasless Transfers**     | Send SOL without paying gas fees               |
| 📝 **On-Chain Memos**        | Write permanent messages on Solana             |
| 🥩 **SOL Staking**           | Stake to validators with passkey auth          |
| 💳 **Subscription Payments** | Netflix-style recurring payments in SOL        |

---

## 🚀 Quick Start

```bash
# Install
npm install

# Run
npm run dev
```

> **Requirements:** Node 18+, Modern browser with WebAuthn (Chrome 108+, Safari 16+, Firefox 119+)

---

## 📚 Tutorials

Step-by-step guides for every feature:

| #   | Tutorial                                                              | Description                        |
| --- | --------------------------------------------------------------------- | ---------------------------------- |
| 1   | [Passkey Wallet](./docs/tutorials/01-PASSKEY_WALLET.md)               | Connect wallets with biometrics    |
| 2   | [Gasless Transactions](./docs/tutorials/02-GASLESS_TRANSACTIONS.md)   | Paymaster-sponsored transfers      |
| 3   | [SOL Staking](./docs/tutorials/03-SOL_STAKING.md)                     | Multi-instruction staking          |
| 4   | [On-Chain Memos](./docs/tutorials/04-ON_CHAIN_MEMOS.md)               | Permanent blockchain messages      |
| 5   | [Subscription Payments](./docs/tutorials/05-SUBSCRIPTION_PAYMENTS.md) | Recurring payment flows            |
| 6   | [Session Management](./docs/tutorials/06-SESSION_MANAGEMENT.md)       | Persist sessions with localStorage |

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
| [Deployment](./docs/DEPLOYMENT.md)           | Vercel & production guide     |

---

## 🌐 App Structure

```
app/
├── (auth)/
│   └── login/         # Passkey authentication
├── (dashboard)/
│   ├── page.tsx       # Dashboard home
│   ├── transfer/      # Gasless transfers
│   ├── memo/          # On-chain memos
│   ├── staking/       # SOL staking
│   └── pricing/       # Subscription plans
hooks/                 # Custom React hooks
lib/
├── services/          # Business logic
├── constants.ts       # Configuration
└── utils.ts           # Helper functions
components/            # UI components
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

---

## 🔗 Resources

- [LazorKit Docs](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/phasewalk1/lazorkit)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

---

## 📄 License

MIT

---

