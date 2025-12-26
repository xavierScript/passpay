"use client";
import { useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PLANS, RECIPIENT_WALLET } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function SubscribePage() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } =
    useWallet();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(amount: number, planName: string) {
    if (!isConnected || !smartWalletPubkey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Instruction
      const destination = new PublicKey(RECIPIENT_WALLET);
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: destination,
        lamports: amount * LAMPORTS_PER_SOL,
      });

      toast.loading("Approve with your passkey...");

      // 2. Sign and Send
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          feeToken: "USDC", // Gas paid in USDC by paymaster
        },
      });

      toast.dismiss();
      toast.success(`${planName} subscription activated! 🎉`);
      console.log("Transaction confirmed:", signature);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Transaction failed");
      console.error("Transfer failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">Subscribe with SOL</h1>
          <p className="mt-2 text-neutral-400">
            Gasless transactions powered by LazorKit ⚡
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, idx) => (
            <Card
              key={plan.id}
              className={idx === 1 ? "border-indigo-600" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {idx === 1 && (
                    <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs">
                      Popular
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {plan.amount}
                  <span className="text-sm font-normal text-neutral-400">
                    {" "}
                    SOL
                  </span>
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() => handleSubscribe(plan.amount, plan.name)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-indigo-800 bg-indigo-900/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-indigo-300">
              🚀 LazorKit Gasless Magic
            </h3>
            <p className="mt-2 text-sm text-neutral-300">
              ✅ Transfer SOL to merchant
              <br />
              ✅ Sign with passkey (FaceID/TouchID)
              <br />
              ✅ Gas fees paid in USDC by paymaster
              <br />✅ No extra SOL needed for fees!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
