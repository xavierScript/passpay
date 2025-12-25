import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <nav className="border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">PassPay</h1>
          <Link href="/login">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="text-5xl font-bold leading-tight">
          Subscriptions on Solana,
          <br />
          Powered by Passkeys
        </h1>
        <p className="mt-6 text-lg text-neutral-300">
          No seed phrases. No complexity. Just seamless biometric authentication
          and gasless payments.
        </p>

        <div className="mt-12 flex justify-center gap-4">
          <Link href="/login">
            <Button size="lg" variant="primary">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/subscribe">
            <Button size="lg" variant="outline">
              View Plans
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-xl font-semibold">🔐 Passkey Login</h3>
            <p className="text-sm text-neutral-300">
              Login with FaceID, TouchID, or device PIN. No seed phrases needed.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-xl font-semibold">
              ⛽ Gasless Transactions
            </h3>
            <p className="text-sm text-neutral-300">
              Paymaster sponsorship means users never need SOL for fees.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="mb-2 text-xl font-semibold">
              💳 USDC Subscriptions
            </h3>
            <p className="text-sm text-neutral-300">
              Recurring billing in USDC, handled automatically via smart
              wallets.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
