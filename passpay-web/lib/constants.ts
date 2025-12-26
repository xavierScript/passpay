// LazorKit Default Configuration (from docs)
export const DEFAULT_CONFIG = {
  rpcUrl: "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

// Devnet USDC mint address
export const USDC_MINT = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

// Subscription plans (amounts in USDC)
export const PLANS = [
  { id: "basic", name: "Basic", amount: 0.01 },
  { id: "pro", name: "Pro", amount: 0.05 },
  { id: "premium", name: "Premium", amount: 0.1 },
] as const;

// Where to send subscription payments (replace with your wallet)
export const RECIPIENT_WALLET = "55czFRi1njMSE7eJyDLx1R5yS1Bi5GiL2Ek4F1cZPLFx";
