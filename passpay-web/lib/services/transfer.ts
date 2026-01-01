/**
 * SOL Transfer Service
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Gasless SOL Transfers with LazorKit
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This service handles creating transfer instructions for sending SOL.
 * When combined with LazorKit's paymaster, users can send SOL without
 * needing SOL for gas fees - the paymaster pays fees in USDC.
 *
 * KEY CONCEPTS:
 * - SystemProgram.transfer(): Native SOL transfer instruction
 * - LAMPORTS_PER_SOL: 1 SOL = 1,000,000,000 lamports
 * - Paymaster: Sponsors gas fees, deducted from user's USDC balance
 */

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * Validate a Solana address and return the PublicKey
 * @param address - The address string to validate
 * @returns The PublicKey if valid, null if invalid
 */
export function validateAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

/**
 * Check if an address is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  return validateAddress(address) !== null;
}

/**
 * Validate transfer amount
 * @param amount - The amount string to validate
 * @param minAmount - Minimum amount allowed (default 0)
 * @returns The parsed amount if valid, null if invalid
 */
export function validateAmount(
  amount: string,
  minAmount: number = 0
): number | null {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= minAmount) {
    return null;
  }
  return parsed;
}

/**
 * Create a SOL transfer instruction
 *
 * USAGE WITH LAZORKIT:
 * ```typescript
 * const instruction = createTransferInstruction(
 *   smartWalletPubkey,  // From LazorKit's useWallet()
 *   recipientPubkey,    // Validated PublicKey
 *   0.1                 // Amount in SOL
 * );
 *
 * await signAndSendTransaction({
 *   instructions: [instruction],
 *   transactionOptions: { feeToken: 'USDC' }  // Gasless!
 * });
 * ```
 */
export function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
  });
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Get Solana Explorer URL for a transaction
 */
export function getExplorerUrl(
  signature: string,
  cluster: "devnet" | "mainnet-beta" = "devnet"
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Get Solana Explorer URL for an address
 */
export function getAddressExplorerUrl(
  address: string,
  cluster: "devnet" | "mainnet-beta" = "devnet"
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}
