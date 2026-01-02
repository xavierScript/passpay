"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import { hasActiveSubscription } from "@/lib/services";

interface SubscriptionGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Client-side subscription gate component
 * Checks if user has active subscription in localStorage
 * Redirects to subscribe page if not subscribed
 */
export function SubscriptionGate({
  children,
  redirectTo = "/subscribe",
}: SubscriptionGateProps) {
  const { smartWalletPubkey, isConnected } = useWallet();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isConnected || !smartWalletPubkey) {
      setIsChecking(false);
      setHasAccess(false);
      return;
    }

    // Check subscription status
    const walletAddress = smartWalletPubkey.toBase58();
    const isSubscribed = hasActiveSubscription(walletAddress);

    if (!isSubscribed) {
      // Redirect to subscribe page
      router.push(redirectTo);
      setHasAccess(false);
    } else {
      setHasAccess(true);
    }

    setIsChecking(false);
  }, [isConnected, smartWalletPubkey, router, redirectTo]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#14F195] border-r-transparent"></div>
          <p className="mt-4 text-[#8f8f8f]">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Don't render children if no access
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
