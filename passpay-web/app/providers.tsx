"use client";
import React, { useEffect } from "react";
import { LazorkitProvider } from "@lazorkit/wallet";
import { DEFAULT_CONFIG } from "@/lib/constants";
import { Toaster } from "react-hot-toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Buffer polyfill for SDKs expecting Node globals
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      (window as any).Buffer =
        (window as any).Buffer || require("buffer").Buffer;
    }
  }, []);

  return (
    <LazorkitProvider
      rpcUrl={DEFAULT_CONFIG.rpcUrl}
      portalUrl={DEFAULT_CONFIG.portalUrl}
      paymasterConfig={DEFAULT_CONFIG.paymasterConfig}
      isDebug={true}
    >
      {children}
      <Toaster position="top-right" />
    </LazorkitProvider>
  );
}
