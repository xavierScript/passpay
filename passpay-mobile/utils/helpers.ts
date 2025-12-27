/**
 * Utility functions for PassPay
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Validate if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate a Solana address for display
 * Example: "4Ujf...FfMz"
 */
export function truncateAddress(
  address: string,
  startChars: number = 4,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format lamports to SOL
 */
export function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(9).replace(/\.?0+$/, "");
}

/**
 * Format SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: number,
  decimals: number,
  maxDecimals: number = 4
): string {
  const value = amount / Math.pow(10, decimals);
  return value.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

/**
 * Validate amount input
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || amount === "") return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

/**
 * Get Solana explorer URL for transaction
 */
export function getExplorerUrl(
  signature: string,
  cluster: "mainnet" | "devnet" = "devnet"
): string {
  const baseUrl = "https://explorer.solana.com/tx";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;
  return `${baseUrl}/${signature}${clusterParam}`;
}

/**
 * Get Solana explorer URL for address
 */
export function getAddressExplorerUrl(
  address: string,
  cluster: "mainnet" | "devnet" = "devnet"
): string {
  const baseUrl = "https://explorer.solana.com/address";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;
  return `${baseUrl}/${address}${clusterParam}`;
}

/**
 * Format time ago
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Common Solana token addresses
 */
export const COMMON_TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
} as const;

/**
 * Get token info by symbol
 */
export function getTokenBySymbol(symbol: string):
  | {
      mint: string;
      symbol: string;
      decimals: number;
    }
  | undefined {
  const tokens: Record<
    string,
    { mint: string; symbol: string; decimals: number }
  > = {
    SOL: { mint: COMMON_TOKENS.SOL, symbol: "SOL", decimals: 9 },
    USDC: { mint: COMMON_TOKENS.USDC, symbol: "USDC", decimals: 6 },
    USDT: { mint: COMMON_TOKENS.USDT, symbol: "USDT", decimals: 6 },
    RAY: { mint: COMMON_TOKENS.RAY, symbol: "RAY", decimals: 6 },
  };

  return tokens[symbol.toUpperCase()];
}
