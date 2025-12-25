"use client";
import { useWallet } from "@lazorkit/wallet";
import { Badge } from "@/components/ui/badge";

export function WalletConnect() {
  const { isConnected, wallet } = useWallet();
  if (!isConnected || !wallet?.smartWallet) return <Badge>Not connected</Badge>;
  return (
    <Badge className="bg-green-700">
      {wallet.smartWallet.slice(0, 4)}...{wallet.smartWallet.slice(-4)}
    </Badge>
  );
}
