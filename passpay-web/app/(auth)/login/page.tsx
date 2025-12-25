"use client";
import { useRouter } from "next/navigation";
import { PasskeySetup } from "@/components/PasskeySetup";

export default function LoginPage() {
  const router = useRouter();

  function handleConnected(walletAddress: string) {
    console.log("User connected with wallet:", walletAddress);
    // Redirect to subscribe or dashboard
    router.push("/subscribe");
  }

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-950">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Subscriptions on Solana, Powered by Passkeys
        </h1>
        <PasskeySetup onConnected={handleConnected} />
      </div>
    </div>
  );
}
