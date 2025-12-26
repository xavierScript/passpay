"use client";
import { useRouter } from "next/navigation";
import { PasskeySetup } from "@/components/PasskeySetup";

export default function LoginPage() {
  const router = useRouter();

  function handleConnected(walletAddress: string) {
    console.log("✅ Passkey wallet created:", walletAddress);
    // Redirect to dashboard to see wallet details
    router.push("/manage");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome to PassPay</h1>
          <p className="mt-2 text-neutral-400">
            Create your Solana wallet with just your biometrics
          </p>
          <div className="mt-4 inline-block rounded-full bg-indigo-600/20 px-4 py-1 text-xs text-indigo-300">
            Powered by LazorKit
          </div>
        </div>
        <PasskeySetup onConnected={handleConnected} />
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-300">
            <strong className="text-white">What happens next?</strong>
            <br />
            1️⃣ Your device creates a secure passkey
            <br />
            2️⃣ A Solana smart wallet is deployed for you
            <br />
            3️⃣ View your wallet and subscribe to services!
          </p>
        </div>
      </div>
    </div>
  );
}
