"use client";
import { useEffect, useState, useRef } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { SubscriptionMetadata } from "@/types";

export default function ManagePage() {
  const { smartWalletPubkey, wallet } = useWallet();
  const [subscription, setSubscription] = useState<SubscriptionMetadata | null>(
    null
  );
  const [balance, setBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!smartWalletPubkey || hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    let isMounted = true;

    (async () => {
      try {
        const walletAddress = smartWalletPubkey.toBase58();

        // Fetch both in parallel
        const [subRes, balRes] = await Promise.all([
          fetch(`/api/subscription/status?wallet=${walletAddress}`),
          fetch(`/api/wallet/balance?wallet=${walletAddress}`),
        ]);

        const [subData, balData] = await Promise.all([
          subRes.json(),
          balRes.json(),
        ]);

        if (isMounted) {
          if (subData.ok) setSubscription(subData.data);
          if (balData.ok) {
            setBalance(balData.data.usdcBalance);
            setSolBalance(balData.data.solBalance);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [smartWalletPubkey]);

  async function handleCancel() {
    if (!subscription) return;
    const confirmed = confirm("Are you sure you want to cancel?");
    if (!confirmed) return;
    const res = await fetch("/api/subscription/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: subscription.walletAddress }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success("Subscription cancelled.");
      setSubscription({ ...subscription, status: "cancelled" });
    } else {
      toast.error(data.error || "Cancellation failed.");
    }
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Loading...
      </div>
    );

  if (!smartWalletPubkey || !wallet?.smartWallet)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Please connect your wallet.
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Your passkey-protected Solana wallet on Devnet
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Wallet Details Card */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">💼 Wallet Details</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-neutral-400">Wallet Address</p>
              <p className="font-mono text-sm break-all">
                {wallet.smartWallet}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-400">SOL Balance</p>
                <p className="text-xl font-bold">
                  {solBalance !== null
                    ? `${solBalance.toFixed(4)} SOL`
                    : "Loading..."}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">USDC Balance</p>
                <p className="text-xl font-bold">
                  {balance !== null
                    ? `$${balance.toFixed(2)} USDC`
                    : "Loading..."}
                </p>
              </div>
            </div>

            {balance === 0 && (
              <div className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-900/20 p-3">
                <p className="text-sm text-yellow-200">
                  💡 <strong>Need USDC?</strong> Send devnet USDC to your wallet
                  address above to test subscriptions!
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-neutral-400">Network</p>
                <Badge className="bg-purple-600">Devnet</Badge>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Fee Mode</p>
                <Badge className="bg-indigo-600">Gasless (Paymaster)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        {subscription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Current Plan</h2>
                <Badge
                  className={
                    subscription.status === "active"
                      ? "bg-green-700"
                      : "bg-red-700"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Tier:{" "}
                <span className="font-semibold capitalize">
                  {subscription.tier}
                </span>
              </p>
              <p className="text-sm text-neutral-300">
                Next billing:{" "}
                {new Date(subscription.nextBilling).toLocaleDateString()}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleCancel}>
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        )}

        {!subscription && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">No Active Subscription</h2>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-300 mb-4">
                You don't have an active subscription yet.
              </p>
              <Button onClick={() => (window.location.href = "/subscribe")}>
                Browse Plans
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {subscription && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Payment History</h2>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Date</TH>
                    <TH>Amount</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  <TR>
                    <TD>
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </TD>
                    <TD>$0.05 USDC</TD>
                    <TD>Paid</TD>
                  </TR>
                </TBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
