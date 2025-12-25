import { z } from "zod";

/**
 * Validate environment variables at startup to ensure required config is present.
 */
export const EnvSchema = z.object({
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url(),
  NEXT_PUBLIC_LAZORKIT_API_KEY: z.string().min(1),
  NEXT_PUBLIC_USDC_MINT: z.string().min(32),
  CRON_SECRET: z.string().min(8),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const env = {
    NEXT_PUBLIC_SOLANA_RPC_URL:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    NEXT_PUBLIC_LAZORKIT_API_KEY:
      process.env.NEXT_PUBLIC_LAZORKIT_API_KEY || "",
    NEXT_PUBLIC_USDC_MINT:
      process.env.NEXT_PUBLIC_USDC_MINT ||
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    CRON_SECRET: process.env.CRON_SECRET || "",
  } satisfies Partial<Env> as Env;
  // Throws descriptive error if invalid
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ")}`
    );
  }
  return parsed.data;
}
