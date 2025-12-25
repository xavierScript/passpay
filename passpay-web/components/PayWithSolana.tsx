"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LazorkitManager } from "@/lib/lazorkit";
import toast from "react-hot-toast";

export function PayWithSolana({
  amount,
  recipient,
  onSuccess,
}: {
  amount: number;
  recipient: string;
  onSuccess: (signature: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  async function handlePay() {
    if (!signAndSendTransaction || !smartWalletPubkey) {
      toast.error("Wallet not connected");
      return;
    }
    setLoading(true);
    try {
      const lazorkit = new LazorkitManager({
        signAndSendTransaction,
        smartWalletPubkey,
      });
      const signature = await lazorkit.transferUSDC(amount, recipient);
      toast.success("Payment successful!");
      onSuccess(signature);
      setOpen(false);
    } catch (e: any) {
      if (e.message.includes("insufficient")) {
        toast.error("Not enough USDC. Please add funds.");
      } else {
        toast.error("Payment failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Pay ${amount} USDC</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <h2 className="mb-2 text-lg font-semibold">Confirm Payment</h2>
        <p className="mb-4 text-sm text-neutral-300">Amount: ${amount} USDC</p>
        <div className="flex gap-2">
          <Button onClick={handlePay} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}
