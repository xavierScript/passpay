# 🔐 PassPay

**A comprehensive LazorKit SDK integration example for Web & Mobile**

PassPay demonstrates how to build passkey-powered Solana wallets with gasless transactions across **both** Next.js (Web) and React Native/Expo (Mobile) platforms. Users create wallets using biometric authentication (FaceID, TouchID, Windows Hello) instead of seed phrases, and all transaction fees are covered by LazorKit Paymaster.

> I did this to show that Lazorkit integration was possible for both the Web and Mobile SDK, thereby helping Solana developers get started with passkey authentication and smart wallet transactions.

---

## 🌐 Live Demo

- **Web:** [Deployed on Vercel](https://passpay-tau.vercel.app/) _(Devnet)_

## 📚 Blog Post

- [Passkey Login & Smart Wallet Creation on Solana with Next.js and LazorKit — No More Seed Phrases!](https://dev.to/xavier_script/passkey-login-smart-wallet-creation-on-solana-with-nextjs-and-lazorkit-no-more-seed-phrases-1mbp)

---

## 📸 Screenshots

### Web Application

<p align="center">
  <img src="screenshots/web/connect%20screen.png" alt="Connect Screen" width="45%" />
  <img src="screenshots/web/dashboard%20screen.png" alt="Dashboard" width="45%" />
</p>

<p align="center">
  <img src="screenshots/web/transfer%20screen.png" alt="Transfer Screen" width="45%" />
  <img src="screenshots/web/staking%20screen.png" alt="Staking Screen" width="45%" />
</p>

<p align="center">
  <img src="screenshots/web/memo%20screen.png" alt="Memo Screen" width="45%" />
  <img src="screenshots/web/subscription%20screen.png" alt="Subscription Screen" width="45%" />
</p>

### Mobile Application

<p align="center">
  <img src="screenshots/mobile/connect%20screen%20app.jpeg" alt="Connect Screen" width="30%" />
  <img src="screenshots/mobile/balance%20screen%20app.jpeg" alt="Balance Screen" width="30%" />
  <img src="screenshots/mobile/transfer%20screen%20app.jpeg" alt="Transfer Screen" width="30%" />
</p>

<p align="center">
  <img src="screenshots/mobile/staking%20screen%20app.jpeg" alt="Staking Screen" width="30%" />
  <img src="screenshots/mobile/memo%20screen%20app.jpeg" alt="Memo Screen" width="30%" />
</p>

---

## ✨ Why This Project?

| Challenge                            | Solution                                              |
| ------------------------------------ | ----------------------------------------------------- |
| Seed phrases are confusing for users | Passkeys use biometrics—nothing to write down         |
| Gas fees create friction             | Paymaster sponsors all transaction fees               |
| No cross-platform examples exist     | Full implementations for **web AND mobile**           |
| Documentation is often lacking       | **12+ step-by-step tutorials** with code explanations |

---

## 🚀 What's Included

### Two Complete Implementations

| Platform                               | Framework             | Status      | Documentation                                  |
| -------------------------------------- | --------------------- | ----------- | ---------------------------------------------- |
| **[PassPay Web](./passpay-web)**       | Next.js 15 + React 19 | ✅ Complete | [6 Tutorials](./passpay-web/docs/tutorials)    |
| **[PassPay Mobile](./passpay-mobile)** | React Native + Expo   | ✅ Complete | [5 Tutorials](./passpay-mobile/docs/tutorials) |

### Features Demonstrated

| Feature                    | Web | Mobile | Description                                    |
| -------------------------- | --- | ------ | ---------------------------------------------- |
| 🔐 **Passkey Wallet**      | ✅  | ✅     | Create wallets with biometrics—no seed phrases |
| 💸 **Gasless Transfers**   | ✅  | ✅     | Send SOL without paying gas fees               |
| 📝 **On-Chain Memos**      | ✅  | ✅     | Write permanent messages on Solana             |
| 🥩 **SOL Staking**         | ✅  | ✅     | Stake to validators with passkey auth          |
| 💳 **Subscriptions**       | ✅  | —      | Netflix-style recurring SOL payments           |
| 🔄 **Session Persistence** | ✅  | ✅     | Stay logged in across sessions                 |

> **🔗 Protocol Integration:** The SOL Staking feature demonstrates interaction with Solana's native **StakeProgram** — a production protocol used for securing the network and earning rewards. This shows real-world integration with existing Solana infrastructure.

---

## 📚 Tutorials (11 Total)

Each platform has comprehensive, step-by-step tutorials with:

- Code listings with explanations
- Architecture diagrams
- Copy-paste ready examples
- Testing guidance

### Web Tutorials

| #   | Tutorial                                                                          | Description                              |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | [Passkey Wallet](./passpay-web/docs/tutorials/01-PASSKEY_WALLET.md)               | Connect wallets with WebAuthn biometrics |
| 2   | [Gasless Transactions](./passpay-web/docs/tutorials/02-GASLESS_TRANSACTIONS.md)   | Paymaster-sponsored transfers            |
| 3   | [SOL Staking](./passpay-web/docs/tutorials/03-SOL_STAKING.md)                     | Multi-instruction staking                |
| 4   | [On-Chain Memos](./passpay-web/docs/tutorials/04-ON_CHAIN_MEMOS.md)               | Permanent blockchain messages            |
| 5   | [Subscription Payments](./passpay-web/docs/tutorials/05-SUBSCRIPTION_PAYMENTS.md) | Recurring payment flows                  |
| 6   | [Session Management](./passpay-web/docs/tutorials/06-SESSION_MANAGEMENT.md)       | Persist sessions with localStorage       |

### Mobile Tutorials

| #   | Tutorial                                                                           | Description                         |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | [Passkey Wallet](./passpay-mobile/docs/tutorials/01-PASSKEY_WALLET.md)             | Connect wallets with FaceID/TouchID |
| 2   | [Gasless Transactions](./passpay-mobile/docs/tutorials/02-GASLESS_TRANSACTIONS.md) | Paymaster-sponsored transfers       |
| 3   | [SOL Staking](./passpay-mobile/docs/tutorials/03-SOL_STAKING.md)                   | Multi-instruction staking           |
| 4   | [On-Chain Memos](./passpay-mobile/docs/tutorials/04-ON_CHAIN_MEMOS.md)             | Permanent blockchain messages       |
| 5   | [Session Management](./passpay-mobile/docs/tutorials/05-SESSION_MANAGEMENT.md)     | Persist sessions with AsyncStorage  |

---

## 🏃 Quick Start

### Web (Next.js)

```bash
cd passpay-web

# Copy environment variables
cp .env.example .env.local

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Mobile (Expo)

```bash
cd passpay-mobile

# Copy environment variables (optional - has defaults)
cp .env.example .env

# Install dependencies
npm install --legacy-peer-deps

# Start Expo
npx expo start
```

Scan QR code with Expo Go app

---

## 🏗️ Project Structure

```
passpay/
├── passpay-web/                 # Next.js 15 application
│   ├── app/                     # App Router pages
│   ├── features/                # Feature modules (wallet, transfer, staking, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Services, utilities, constants
│   ├── components/              # UI components
│   └── docs/                    # 📚 Web documentation & tutorials
│
├── passpay-mobile/              # React Native/Expo application
│   ├── app/                     # Expo Router screens
│   ├── features/                # Feature modules (wallet, transfer, staking, etc.)
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # Business logic
│   ├── components/              # UI components
│   └── docs/                    # 📚 Mobile documentation & tutorials
│
└── README.md                    # You are here
```

---

## 📖 Documentation

Each platform has comprehensive documentation:

| Document        | Web                                           | Mobile                                           |
| --------------- | --------------------------------------------- | ------------------------------------------------ |
| Quick Start     | [View](./passpay-web/docs/QUICK_START.md)     | [View](./passpay-mobile/docs/QUICK_START.md)     |
| Installation    | [View](./passpay-web/docs/INSTALLATION.md)    | [View](./passpay-mobile/docs/INSTALLATION.md)    |
| Architecture    | [View](./passpay-web/docs/ARCHITECTURE.md)    | [View](./passpay-mobile/docs/ARCHITECTURE.md)    |
| API Reference   | [View](./passpay-web/docs/API_REFERENCE.md)   | [View](./passpay-mobile/docs/API_REFERENCE.md)   |
| Troubleshooting | [View](./passpay-web/docs/TROUBLESHOOTING.md) | [View](./passpay-mobile/docs/TROUBLESHOOTING.md) |

---

## 🔧 Tech Stack

### Web

- **Framework:** Next.js 15 (App Router)
- **React:** 19 with Server Components
- **Styling:** Tailwind CSS + shadcn/ui
- **Wallet:** LazorKit SDK (`@lazorkit/wallet`)
- **Blockchain:** Solana Web3.js

### Mobile

- **Framework:** React Native + Expo SDK 52
- **Navigation:** Expo Router
- **Styling:** React Native StyleSheet
- **Wallet:** LazorKit Mobile Adapter (`@lazorkit/wallet-mobile-adapter`)
- **Blockchain:** Solana Web3.js

---

## 🔗 Resources

| Resource        | Link                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| LazorKit Docs   | [docs.lazorkit.com](https://docs.lazorkit.com/)                                       |
| LazorKit GitHub | [github.com/lazor-kit](https://github.com/lazor-kit/)                                 |
| Solana Web3.js  | [solana-labs.github.io/solana-web3.js](https://solana-labs.github.io/solana-web3.js/) |
| Expo Docs       | [docs.expo.dev](https://docs.expo.dev/)                                               |
| Next.js Docs    | [nextjs.org/docs](https://nextjs.org/docs)                                            |

---

## � Author

**David Onwuka** — [@xavierScript](https://twitter.com/xavierScript)

If you found this helpful, give it a ⭐ on GitHub!

---

## �📝 License

MIT © PassPay

---

<p align="center">
  <b>Built with ❤️ for the Solana developer community</b><br>
  <sub>Helping developers build passwordless, gasless Solana apps</sub>
</p>
