import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: "🔐",
    title: "Passkey Wallets",
    description:
      "Create a Solana wallet with FaceID, TouchID, or Windows Hello. Your device is your wallet - no seed phrases.",
    highlight: false,
  },
  {
    icon: "⚡",
    title: "Gasless Transactions",
    description:
      "LazorKit Paymaster covers all gas fees. Users never need SOL - just approve with biometrics.",
    highlight: true,
  },
  {
    icon: "💸",
    title: "SOL Transfers",
    description:
      "Send SOL to any address with gasless transactions. Perfect UX for onboarding new users.",
    highlight: false,
  },
  {
    icon: "📝",
    title: "On-Chain Memos",
    description:
      "Write permanent messages on Solana. Great for proof of existence and integration testing.",
    highlight: false,
  },
  {
    icon: "🥩",
    title: "SOL Staking",
    description:
      "Stake SOL to validators using passkey authentication. Multi-instruction transactions made simple.",
    highlight: false,
  },
  {
    icon: "💳",
    title: "Subscriptions",
    description:
      "Subscribe to services with instant SOL payments. Recurring payments powered by smart wallets.",
    highlight: false,
  },
];

const steps = [
  {
    step: "1",
    title: "Connect with Passkey",
    description:
      "Create a wallet using your device's biometric authentication. No seed phrases to write down or remember.",
  },
  {
    step: "2",
    title: "Explore Features",
    description:
      "Transfer SOL, write on-chain memos, stake to validators, or subscribe to services - all gasless.",
  },
  {
    step: "3",
    title: "Approve with Biometrics",
    description:
      "Every transaction is signed with your fingerprint or face. LazorKit Paymaster covers the gas fees.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <h1 className="text-xl font-bold">PassPay</h1>
            <span className="rounded-full bg-[#14F195]/15 px-2 py-0.5 text-xs text-[#14F195]">
              Devnet
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#8f8f8f] hover:text-white transition-colors"
            >
              GitHub ↗
            </a>
            <Link href="/login">
              <Button variant="primary">Launch App</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 px-4 py-2 text-sm text-[#14F195]">
            <span>⚡</span>
            <span>Powered by LazorKit SDK</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Solana Made Simple,
            <br />
            <span className="text-[#14F195]">Powered by Passkeys</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[#8f8f8f] max-w-2xl mx-auto">
            No seed phrases. No gas fees. Just seamless biometric
            authentication. A complete starter template for building with
            LazorKit.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8"
              >
                🚀 Try Live Demo
              </Button>
            </Link>
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto px-8"
              >
                📚 Read Docs
              </Button>
            </a>
          </div>

          {/* Tech Stack Badge */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              "Next.js",
              "LazorKit SDK",
              "Solana",
              "WebAuthn",
              "TypeScript",
            ].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1 text-xs text-[#8f8f8f]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold mb-8">
            ✨ What&apos;s Included
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl border p-6 transition-all hover:border-[#14F195]/30 ${
                  feature.highlight
                    ? "border-[#14F195]/30 bg-[#14F195]/5"
                    : "border-[#1a1a1a] bg-[#0a0a0a]"
                }`}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#8f8f8f]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-8 md:p-12">
          <h2 className="text-center text-2xl font-bold mb-8">
            🛠️ How It Works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#14F195] text-black text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#8f8f8f]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold mb-8">
            👩‍💻 Simple Integration
          </h2>
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
            <div className="border-b border-[#1a1a1a] px-4 py-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-[#14F195]"></div>
              <span className="ml-2 text-xs text-[#8f8f8f]">
                TransferButton.tsx
              </span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-[#8f8f8f]">{`import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

function TransferButton() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const handleTransfer = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: recipientPubkey,
      lamports: 0.1 * LAMPORTS_PER_SOL
    });

    // 🎉 Gasless - paymaster covers the fee!
    const signature = await signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: { feeToken: 'USDC' }
    });
  };

  return <button onClick={handleTransfer}>Send 0.1 SOL</button>;
}`}</code>
            </pre>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center rounded-2xl border border-[#14F195]/20 bg-gradient-to-br from-[#14F195]/5 to-[#14F195]/10 p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Build?
          </h2>
          <p className="text-[#8f8f8f] max-w-xl mx-auto mb-8">
            Fork this template and start building your own passkey-powered
            Solana app. Full documentation and step-by-step tutorials included.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button size="lg" variant="primary">
                🚀 Launch Demo
              </Button>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                ⭐ Star on GitHub
              </Button>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-20 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8f8f8f]">
          <div className="flex items-center gap-2">
            <span>🔐</span>
            <span>PassPay - A LazorKit Integration Example</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14F195] transition-colors"
            >
              LazorKit Docs
            </a>
            <a
              href="https://t.me/lazorkit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14F195] transition-colors"
            >
              Telegram
            </a>
            <a
              href="https://github.com/lazor-kit/lazor-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#14F195] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
