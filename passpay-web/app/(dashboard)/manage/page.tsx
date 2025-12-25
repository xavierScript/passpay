"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { SubscriptionMetadata } from "@/types";

export default function ManagePage() {
  const { smartWalletPubkey } = useWallet();
  const [subscription, setSubscription] = useState<SubscriptionMetadata | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!smartWalletPubkey) return;
    (async () => {
      const res = await fetch(
        `/api/subscription/status?wallet=${smartWalletPubkey.toBase58()}`
      );
      const data = await res.json();
      if (data.ok) setSubscription(data.data);
      setLoading(false);
    })();
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
  if (!subscription)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        No active subscription found.
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <h1 className="mb-8 text-3xl font-bold">Manage Subscription</h1>
      <div className="mx-auto max-w-3xl space-y-6">
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
                  <TD>$10 USDC</TD>
                  <TD>Paid</TD>
                </TR>
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
