import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">PassPay</h1>
          <Link href="/login">
            <Button variant="primary">Launch App</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="mb-4 inline-block rounded-full bg-indigo-600/20 px-4 py-1 text-sm">
          Powered by LazorKit
        </div>

        <h1 className="text-5xl font-bold leading-tight">
          Subscriptions on Solana,
          <br />
          Powered by Passkeys
        </h1>

        <p className="mt-6 text-lg text-neutral-300">
          No seed phrases. No gas fees. Just seamless biometric authentication
          and USDC payments.
        </p>

        <div className="mt-12 flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg" variant="primary">
              🚀 Try It Now
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-xl font-semibold">🔐 Passkey Wallets</h3>
            <p className="text-sm text-neutral-300">
              Create a Solana wallet with FaceID, TouchID, or Windows Hello.
              Your device is your wallet.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-800 bg-indigo-900/20 p-6">
            <h3 className="mb-2 text-xl font-semibold">
              ⛽ Gasless Transactions
            </h3>
            <p className="text-sm text-neutral-300">
              LazorKit Paymaster covers all gas fees. Users never need SOL -
              just USDC.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-xl font-semibold">💳 SOL Subscriptions</h3>
            <p className="text-sm text-neutral-300">
              Subscribe to services with instant SOL payments - gas
              automatically paid in USDC.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
          <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
          <div className="grid gap-4 text-left md:grid-cols-3">
            <div>
              <div className="mb-2 inline-block rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold">
                Step 1
              </div>
              <p className="text-neutral-300">
                Create a wallet using your device's biometric authentication. No
                seed phrases to write down.
              </p>
            </div>
            <div>
              <div className="mb-2 inline-block rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold">
                Step 2
              </div>
              <p className="text-neutral-300">
                Fund your wallet with devnet SOL for testing. Your wallet
                displays both SOL and USDC balances.
              </p>
            </div>
            <div>
              <div className="mb-2 inline-block rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold">
                Step 3
              </div>
              <p className="text-neutral-300">
                Subscribe to a plan - send SOL while LazorKit pays your gas fees
                in USDC automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
