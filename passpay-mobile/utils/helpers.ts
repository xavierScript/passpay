/**
 * Utility Functions for PassPay
 *
 * Common helper functions used throughout the app for:
 * - Solana address validation and formatting
 * - Explorer URL generation
 *
 * These utilities keep the codebase DRY and provide consistent
 * formatting across all screens.
 */

import { PublicKey } from "@solana/web3.js";

/**
 * Validate if a string is a valid Solana address
 *
 * @example
 * isValidSolanaAddress("4Ujf...") // true
 * isValidSolanaAddress("invalid") // false
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
 *
 * @example
 * truncateAddress("4UjfJZ8K...FfMz") // "4Ujf...FfMz"
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
 * Get Solana Explorer URL for a transaction signature
 *
 * @example
 * getExplorerUrl("5wHu...") // "https://explorer.solana.com/tx/5wHu...?cluster=devnet"
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
 * Get Solana Explorer URL for an account address
 *
 * @example
 * getAddressExplorerUrl("4Ujf...") // "https://explorer.solana.com/address/4Ujf...?cluster=devnet"
 */
export function getAddressExplorerUrl(
  address: string,
  cluster: "mainnet" | "devnet" = "devnet"
): string {
  const baseUrl = "https://explorer.solana.com/address";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;
  return `${baseUrl}/${address}${clusterParam}`;
}
