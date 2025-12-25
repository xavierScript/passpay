export const DEFAULT_CONFIG = {
  rpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  portalUrl: "https://portal.lazor.sh",
  paymasterConfig: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
    apiKey: process.env.NEXT_PUBLIC_LAZORKIT_API_KEY || undefined,
  },
  clusterSimulation: "devnet" as const,
};

export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    amount: 5,
    description: "Access to basic content",
  },
  {
    id: "pro",
    name: "Pro",
    amount: 10,
    description: "Premium content + features",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    amount: 20,
    description: "All content + priority support",
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export const SUBSCRIPTION_USDC_RECIPIENT =
  "6kQPt6c83oQKvJxfk2s8wU2zH1GvvpPYGQkqkMZRecipient"; // Replace with your recipient address
