"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasskeySetup } from "@/components";
import { Logo } from "@/components";

export default function LoginPage() {
  const router = useRouter();

  function handleConnected(walletAddress: string) {
    void walletAddress; // Used implicitly for routing
    router.push("/manage");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} showText />
          </Link>
          <span className="rounded-full bg-[#14F195]/20 px-3 py-1 text-xs text-[#14F195]">
            Devnet
          </span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#14F195]/10 border border-[#14F195]/20">
              <Logo size={56} />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome to PassPay
            </h1>
            <p className="mt-2 text-[#8f8f8f]">
              Create your Solana wallet with just your biometrics
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#14F195]/20 px-4 py-2 text-sm text-[#14F195]">
              <span>⚡</span>
              <span>Powered by LazorKit</span>
            </div>
          </div>

          {/* Passkey Setup Card */}
          <PasskeySetup onConnected={handleConnected} />

          {/* Features List */}
          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5">
            <p className="text-sm font-medium text-white mb-3">
              ✨ What happens next?
            </p>
            <div className="space-y-2 text-sm text-[#8f8f8f]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#14F195] text-xs font-bold text-black">
                  1
                </span>
                <span>Your device creates a secure passkey</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#14F195] text-xs font-bold text-black">
                  2
                </span>
                <span>A Solana smart wallet is deployed for you</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#14F195] text-xs font-bold text-black">
                  3
                </span>
                <span>Transfer, stake, memo & subscribe gaslessly!</span>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="rounded-xl border border-[#14F195]/30 bg-[#14F195]/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-medium text-[#14F195]">
                  Secure by Design
                </p>
                <p className="text-xs text-[#14F195]/70 mt-1">
                  Your private key never leaves your device&apos;s secure
                  enclave. No seed phrases to write down or lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
