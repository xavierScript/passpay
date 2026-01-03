/**
 * SOL Transfer Service
 *
 * Handles creating transfer instructions for sending SOL between wallets.
 * Used with LazorKit's paymaster for gasless transactions.
 */

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

// Re-export common utilities from helpers for convenience
export {
  getAddressExplorerUrl,
  getExplorerUrl,
  isValidSolanaAddress,
  truncateAddress,
} from "@/utils/helpers";

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
 * @param fromPubkey - The sender's public key
 * @param toPubkey - The recipient's public key
 * @param amountSol - The amount in SOL to transfer
 */
export function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: amountSol * LAMPORTS_PER_SOL,
  });
}
