# 📚 PassPay Web Documentation

Comprehensive documentation for integrating LazorKit SDK in Next.js web applications.

## 📖 Documentation Index

### Getting Started

- [**Quick Start Guide**](./QUICK_START.md) - Get running in 5 minutes
- [**Installation & Setup**](./INSTALLATION.md) - Detailed setup guide with configuration

### Tutorials (Step-by-Step)

- [**Tutorial 1: Passkey Wallet Creation**](./tutorials/01-PASSKEY_WALLET.md) - Create passwordless wallets with biometrics
- [**Tutorial 2: Gasless Transactions**](./tutorials/02-GASLESS_TRANSACTIONS.md) - Send SOL without paying gas fees
- [**Tutorial 3: Building Reusable Hooks**](./tutorials/03-REUSABLE_HOOKS.md) - Abstract LazorKit patterns into custom hooks
- [**Tutorial 4: Native SOL Staking**](./tutorials/04-SOL_STAKING.md) - Stake SOL with multi-instruction transactions
- [**Tutorial 5: On-Chain Memos**](./tutorials/05-ON_CHAIN_MEMOS.md) - Store permanent messages on Solana
- [**Tutorial 6: Subscription Payments**](./tutorials/06-SUBSCRIPTION_PAYMENTS.md) - Build Netflix-style recurring payments
- [**Tutorial 7: Session Management**](./tutorials/07-SESSION_MANAGEMENT.md) - Persist user sessions with local storage

### Reference

- [**Architecture Overview**](./ARCHITECTURE.md) - How the app is structured
- [**API Reference**](./API_REFERENCE.md) - Custom hooks and services documentation
- [**Troubleshooting**](./TROUBLESHOOTING.md) - Common issues and solutions

### Additional Resources

- [**Deployment Guide**](./DEPLOYMENT.md) - Deploy to Vercel / Production
- [**Testing Guide**](./TESTING.md) - Unit testing setup and examples

---

## 🎯 What Makes This Documentation Special

1. **Real Code Examples** - Every tutorial uses actual code from PassPay Web, not hypothetical snippets
2. **Progressive Learning** - Start simple, build complexity gradually
3. **Copy-Paste Ready** - All code blocks are tested and working
4. **Visual Aids** - Architecture diagrams and flow charts
5. **Production Patterns** - Learn best practices for real apps
6. **Web-Focused** - Tailored for Next.js and browser environments

---

## 🔗 Quick Links

| Resource        | Link                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| LazorKit Docs   | [docs.lazorkit.com](https://docs.lazorkit.com/)                                       |
| LazorKit GitHub | [github.com/lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit)              |
| Solana Web3.js  | [solana-labs.github.io/solana-web3.js](https://solana-labs.github.io/solana-web3.js/) |
| Next.js Docs    | [nextjs.org/docs](https://nextjs.org/docs)                                            |
| Vercel          | [vercel.com](https://vercel.com)                                                      |

---

## 🌐 Web vs Mobile

This documentation is for the **Next.js web version** of PassPay. Key differences from the mobile version:

| Aspect         | Mobile (Expo)                     | Web (Next.js)         |
| -------------- | --------------------------------- | --------------------- |
| SDK            | `@lazorkit/wallet-mobile-adapter` | `@lazorkit/wallet`    |
| Polyfills      | Extensive (Buffer, crypto, URL)   | Minimal (Buffer only) |
| Authentication | expo-web-browser + deep links     | Native WebAuthn       |
| UI Framework   | React Native + StyleSheet         | React + Tailwind CSS  |
| Routing        | Expo Router                       | Next.js App Router    |
| Deployment     | App Store / Play Store            | Vercel / Any hosting  |

---

## 📝 License

MIT © PassPay
