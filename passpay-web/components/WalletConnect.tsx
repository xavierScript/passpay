"use client";
import { useWallet } from "@lazorkit/wallet";
import { Button } from "@/components/ui/button";

export function WalletConnect() {
  const { connect, disconnect, isConnected, isConnecting, wallet } =
    useWallet();

  if (isConnecting) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <span className="animate-pulse">Connecting...</span>
      </Button>
    );
  }

  if (isConnected && wallet?.smartWallet) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/20 px-3 py-1 text-xs text-[#14F195] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-[#14F195] animate-pulse"></span>
          {wallet.smartWallet.slice(0, 4)}...{wallet.smartWallet.slice(-4)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => connect({ feeMode: "paymaster" })}
    >
      🔐 Connect
    </Button>
  );
}
