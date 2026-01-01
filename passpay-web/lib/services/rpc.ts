/**
 * RPC Service
 *
 * Handles Solana RPC connections and balance fetching.
 * Uses the same devnet configuration as LazorKit.
 */

import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { DEFAULT_CONFIG } from "../constants";

// Singleton connection instance
let connectionInstance: Connection | null = null;

/**
 * Get or create a connection to the Solana network
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(DEFAULT_CONFIG.rpcUrl, "confirmed");
  }
  return connectionInstance;
}

/**
 * Fetch SOL balance for a wallet
 * @param pubkey - The wallet public key
 * @returns Balance in SOL
 */
export async function getSolBalance(pubkey: PublicKey): Promise<number> {
  const connection = getConnection();
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Fetch SOL balance for a wallet address string
 * @param address - The wallet address as string
 * @returns Balance in SOL
 */
export async function getSolBalanceByAddress(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    return await getSolBalance(pubkey);
  } catch {
    return 0;
  }
}

/**
 * Clear any cached connection (for testing/refresh)
 */
export function clearConnectionCache(): void {
  connectionInstance = null;
}
