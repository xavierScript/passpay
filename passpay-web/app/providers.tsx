"use client";
import React, { useEffect } from "react";
import { LazorkitProvider } from "@lazorkit/wallet";
import { DEFAULT_CONFIG } from "@/lib/constants";
import { Toaster } from "react-hot-toast";
import { Buffer } from "buffer";
import "@/lib/debug"; // Import debug utilities

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Buffer polyfill for SDKs expecting Node globals
    if (typeof window !== "undefined" && !window.Buffer) {
      window.Buffer = Buffer;
    }
  }, []);

  return (
    <LazorkitProvider
      rpcUrl={DEFAULT_CONFIG.rpcUrl}
      portalUrl={DEFAULT_CONFIG.portalUrl}
      paymasterConfig={DEFAULT_CONFIG.paymasterConfig}
    >
      {children}
      <Toaster position="top-right" />
    </LazorkitProvider>
  );
}
