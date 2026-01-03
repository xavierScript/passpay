# 🔐 PassPay

**Passkey-powered Solana wallet suite with gasless transactions**

A complete starter template demonstrating [LazorKit SDK](https://docs.lazorkit.com/) integration for biometric Solana wallets. Build Web3 apps with the UX of Web2—no seed phrases, no gas fees, just biometric authentication.

---

## 🌟 What is PassPay?

PassPay is a production-ready starter template that showcases how to build Solana applications with:

- **Passkey Authentication** - Users create wallets with FaceID, TouchID, or Windows Hello
- **Gasless Transactions** - LazorKit Paymaster covers all gas fees
- **Multi-Platform** - Consistent experience across Web and Mobile
- **Full-Stack Features** - Transfers, staking, memos, and subscription payments

Perfect for developers building user-friendly Web3 applications without the complexity of traditional crypto wallets.

---

## 📦 Projects

This monorepo contains two complete applications:

### 🌐 [PassPay Web](./passpay-web)

Next.js 15 application with advanced features

**Features:**

- 🔐 Passkey wallet creation and authentication
- 💸 Gasless SOL transfers
- 📝 On-chain memo storage
- 🥩 SOL staking to validators
- 💳 Subscription payment flows
- 📱 Fully responsive design

**Quick Start:**

```bash
cd passpay-web
npm install
npm run dev
```

**[📖 Full Documentation](./passpay-web/README.md)**

---

### 📱 [PassPay Mobile](./passpay-mobile)

React Native + Expo application for iOS/Android

**Features:**

- 🔐 Biometric wallet authentication (FaceID/TouchID)
- 💸 Gasless SOL transfers
- 📝 On-chain memo storage
- 🥩 SOL staking functionality
- 🎨 Native UI components

**Quick Start:**

```bash
cd passpay-mobile
npm install --legacy-peer-deps
npx expo start
```

**[📖 Full Documentation](./passpay-mobile/README.md)**

---

## ✨ Key Features

| Feature                 | Web | Mobile | Description                              |
| ----------------------- | --- | ------ | ---------------------------------------- |
| 🔐 Passkey Wallets      | ✅  | ✅     | Biometric authentication—no seed phrases |
| ⚡ Gasless Transactions | ✅  | ✅     | Paymaster covers all fees                |
| 💸 SOL Transfers        | ✅  | ✅     | Send SOL to any address                  |
| 📝 On-Chain Memos       | ✅  | ✅     | Permanent blockchain messages            |
| 🥩 Staking              | ✅  | ✅     | Delegate to validators                   |
| 💳 Subscriptions        | ✅  | ❌     | Recurring payment flows                  |
| 📱 Responsive Design    | ✅  | ✅     | Works on all devices                     |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Modern Browser** (Chrome 108+, Safari 16+, Firefox 119+) for Web
- **Expo CLI** for Mobile development
- **iOS Simulator** or **Android Emulator** for Mobile testing

### Quick Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd passpay
   ```

2. **Choose your platform:**

   **For Web Development:**

   ```bash
   cd passpay-web
   npm install
   npm run dev
   # Open http://localhost:3000
   ```

   **For Mobile Development:**

   ```bash
   cd passpay-mobile
   npm install --legacy-peer-deps
   npx expo start
   # Press 'i' for iOS or 'a' for Android
   ```

3. **Test on Devnet**
   - Both apps default to Solana Devnet
   - Get free devnet SOL from [Solana Faucet](https://faucet.solana.com)
   - Create a passkey wallet and start testing!

---

## 📚 Documentation

### Web Documentation

- [Quick Start Guide](./passpay-web/docs/QUICK_START.md) - Get up and running in 5 minutes
- [Installation Guide](./passpay-web/docs/INSTALLATION.md) - Detailed setup instructions
- [Architecture Overview](./passpay-web/docs/ARCHITECTURE.md) - Project structure and design patterns
- [API Reference](./passpay-web/docs/API_REFERENCE.md) - Complete API documentation
- [Tutorials](./passpay-web/docs/tutorials/) - Step-by-step feature guides
- [Testing Guide](./passpay-web/docs/TESTING.md) - Testing strategies and examples
- [Deployment](./passpay-web/docs/DEPLOYMENT.md) - Production deployment guide

### Mobile Documentation

- [Quick Start Guide](./passpay-mobile/docs/QUICK_START.md) - Mobile setup in 5 minutes
- [Installation Guide](./passpay-mobile/docs/INSTALLATION.md) - Mobile-specific setup
- [Architecture Overview](./passpay-mobile/docs/ARCHITECTURE.md) - Mobile app structure
- [API Reference](./passpay-mobile/docs/API_REFERENCE.md) - Mobile API docs
- [Tutorials](./passpay-mobile/docs/tutorials/) - Mobile feature tutorials
- [Testing Guide](./passpay-mobile/docs/TESTING.md) - Mobile testing guide
- [Deployment](./passpay-mobile/docs/DEPLOYMENT.md) - App Store & Play Store guide

---

## 🛠️ Tech Stack

### Shared Technologies

- **Solana Web3.js** - Blockchain interaction
- **LazorKit SDK** - Passkey wallets & gasless transactions
- **TypeScript** - Type-safe development
- **Jest** - Testing framework

### Web Stack

- **Next.js 15** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form management
- **Vitest** - Unit testing

### Mobile Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform & build tools
- **Expo Router** - File-based navigation
- **React Native Testing Library** - Component testing

---

## 🎯 Use Cases

This template is perfect for building:

- **DeFi Applications** - Staking, swaps, lending with biometric auth
- **NFT Marketplaces** - Gasless NFT minting and trading
- **Gaming Wallets** - In-game transactions without gas fees
- **Social dApps** - Web3 social features with Web2 UX
- **Payment Apps** - Subscription services on Solana
- **Enterprise Apps** - Secure corporate blockchain applications

---

## 🔗 Quick Links

### Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/phasewalk1/lazorkit)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)

### Community

- [LazorKit Discord](https://discord.gg/lazorkit) _(if available)_
- [Solana Stack Exchange](https://solana.stackexchange.com/)

---

## 📁 Repository Structure

```
passpay/
├── passpay-web/           # Next.js web application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Business logic & services
│   ├── docs/              # Comprehensive documentation
│   └── tests/             # Unit & integration tests
│
├── passpay-mobile/        # React Native mobile app
│   ├── app/               # Expo router screens
│   ├── components/        # Mobile components
│   ├── hooks/             # Custom hooks
│   ├── services/          # Business logic
│   ├── docs/              # Mobile documentation
│   └── __tests__/         # Mobile tests
│
└── README.md              # This file
```

---

## 🔧 Configuration

Both applications use Solana **Devnet** by default:

```typescript
{
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterUrl: "https://kora.devnet.lazorkit.com",
}
```

To switch to **Mainnet**, update the configuration in:

- Web: `passpay-web/lib/constants.ts`
- Mobile: Update RPC URLs in provider configuration

---

## 🧪 Testing

### Web Testing

```bash
cd passpay-web
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:ui     # Vitest UI
```

### Mobile Testing

```bash
cd passpay-mobile
npm test           # Run all tests
npm run test:watch # Watch mode
```

See [Web Testing Guide](./passpay-web/docs/TESTING.md) and [Mobile Testing Guide](./passpay-mobile/docs/TESTING.md) for details.

---

## 🚢 Deployment

### Web Deployment

The web app is optimized for deployment on **Vercel**:

```bash
cd passpay-web
npm run build      # Build for production
npm run start      # Test production build locally
```

See [Web Deployment Guide](./passpay-web/docs/DEPLOYMENT.md) for complete instructions.

### Mobile Deployment

Build for iOS and Android using **EAS Build**:

```bash
cd passpay-mobile
eas build --platform ios     # Build for iOS
eas build --platform android # Build for Android
```

See [Mobile Deployment Guide](./passpay-mobile/docs/DEPLOYMENT.md) for App Store and Play Store submissions.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

Please ensure your code:

- Follows the existing code style
- Includes appropriate tests
- Updates documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **[LazorKit](https://lazorkit.com/)** - For the amazing passkey wallet SDK
- **[Solana Foundation](https://solana.org/)** - For the high-performance blockchain
- **[Vercel](https://vercel.com/)** - For excellent Next.js hosting
- **[Expo](https://expo.dev/)** - For streamlined mobile development

---

## 💡 Support

Having trouble? Check out:

1. **Documentation**

   - [Web Troubleshooting](./passpay-web/docs/TROUBLESHOOTING.md)
   - [Mobile Troubleshooting](./passpay-mobile/docs/TROUBLESHOOTING.md)

2. **LazorKit Resources**

   - [LazorKit Docs](https://docs.lazorkit.com/)
   - [LazorKit GitHub Issues](https://github.com/phasewalk1/lazorkit/issues)

3. **Solana Resources**
   - [Solana Stack Exchange](https://solana.stackexchange.com/)
   - [Solana Discord](https://discord.com/invite/solana)

---

<div align="center">

**Built with ❤️ using LazorKit & Solana**

[Get Started](./passpay-web/docs/QUICK_START.md) • [Documentation](./passpay-web/docs/) • [Tutorials](./passpay-web/docs/tutorials/)

</div>
