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
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isSupported =
      typeof window !== "undefined" &&
      !!(window as any).PublicKeyCredential &&
      !!navigator.credentials;
    setSupported(isSupported);
  }, []);

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
    } catch (e: any) {
      const msg = e?.message || "Passkey connection failed";
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
        <h2 className="text-lg font-semibold">🔐 Create Passkey Wallet</h2>
        <p className="text-sm text-neutral-400 mt-1">
          No seed phrases. Just your biometrics.
        </p>
      </CardHeader>
      <CardContent>
        {supported === false && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-900/20 p-3 text-red-200">
            Your device doesn't support biometric login. Use PIN instead.
          </div>
        )}
        <div className="space-y-3">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting
              ? "Creating Wallet..."
              : "✨ Create Wallet with Passkey"}
          </Button>
          <p className="text-xs text-neutral-400 text-center">
            Powered by LazorKit - Your device is your wallet
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {wallet?.smartWallet && (
          <div className="mt-4 p-3 rounded bg-green-900/20 border border-green-500/40">
            <p className="text-sm text-green-200 font-semibold">
              ✓ Wallet Created!
            </p>
            <p className="text-xs text-neutral-300 mt-1 font-mono break-all">
              {wallet.smartWallet}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
