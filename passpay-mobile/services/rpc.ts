/**
 * Solana RPC Service with rate limiting and caching
 *
 * The public Solana devnet RPC has strict rate limits (429 errors).
 * This service adds:
 * - Request throttling
 * - Response caching
 * - Single connection instance
 */

import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

// Use a more reliable RPC endpoint
// The public devnet endpoint has strict rate limits
export const DEVNET_RPC = "https://api.devnet.solana.com";

// Single connection instance for the whole app
let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(DEVNET_RPC, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return _connection;
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30_000; // 30 seconds cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Throttle queue
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200; // 200ms between requests

async function throttle(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
}

/**
 * Get SOL balance with caching
 */
export async function getSolBalance(pubkey: PublicKey): Promise<number> {
  const cacheKey = `sol:${pubkey.toBase58()}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;

  await throttle();
  const connection = getConnection();
  const balance = await connection.getBalance(pubkey);
  const solBalance = balance / LAMPORTS_PER_SOL;

  setCache(cacheKey, solBalance);
  return solBalance;
}

/**
 * Get token balance with caching
 */
export async function getTokenBalance(
  tokenAccount: PublicKey
): Promise<{ amount: number; decimals: number } | null> {
  const cacheKey = `token:${tokenAccount.toBase58()}`;
  const cached = getCached<{ amount: number; decimals: number } | null>(
    cacheKey
  );
  if (cached !== null) return cached;

  await throttle();

  try {
    const connection = getConnection();
    const balance = await connection.getTokenAccountBalance(tokenAccount);

    const result = {
      amount: parseFloat(balance.value.uiAmountString || "0"),
      decimals: balance.value.decimals,
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    // Token account doesn't exist
    setCache(cacheKey, null);
    return null;
  }
}

/**
 * Clear cache (useful on refresh)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear cache for specific address
 */
export function clearAddressCache(pubkey: PublicKey): void {
  const address = pubkey.toBase58();
  for (const key of cache.keys()) {
    if (key.includes(address)) {
      cache.delete(key);
    }
  }
}
