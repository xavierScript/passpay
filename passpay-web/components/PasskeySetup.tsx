"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { encryptLocal } from "@/lib/utils";
import toast from "react-hot-toast";

export function PasskeySetup({
  onConnected,
}: {
  onConnected: (walletAddress: string) => void;
}) {
  const { connect, isConnected, isConnecting, wallet } = useWallet();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      onConnected(wallet.smartWallet);
    }
  }, [isConnected, wallet, onConnected]);

  async function handleConnect() {
    setError(null);
    try {
      const info = await connect({ feeMode: "paymaster" });
      if (info?.credentialId) {
        const encrypted = await encryptLocal(info.credentialId);
        localStorage.setItem("lk_credential", encrypted);
      }
      toast.success("Wallet connected!");
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err?.message || "Passkey connection failed";
      setError(msg);
      if (msg.includes("NotAllowedError")) {
        toast.error("You cancelled the passkey prompt.");
      } else if (msg.includes("PublicKeyCredential")) {
        toast.error("Your browser does not support WebAuthn.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">🔐 Passkey Wallet</h2>
        <p className="text-sm text-[#8f8f8f] mt-1">
          No seed phrases. Just your biometrics.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? "Connecting..." : "✨ Continue with Passkey"}
          </Button>
          <p className="text-xs text-[#8f8f8f] text-center">
            Powered by LazorKit - Your device is your wallet
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {wallet?.smartWallet && (
          <div className="mt-4 p-3 rounded bg-[#14F195]/10 border border-[#14F195]/20">
            <p className="text-sm text-[#14F195] font-semibold">
              ✓ Wallet Created!
            </p>
            <p className="text-xs text-[#8f8f8f] mt-1 font-mono break-all">
              {wallet.smartWallet}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
