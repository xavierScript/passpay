/**
 * Memo Program Service
 *
 * The Memo program is one of the simplest Solana programs.
 * It allows you to write arbitrary text data on-chain permanently.
 * Great for proof of existence, notes, or transaction annotations.
 */

import { PublicKey, TransactionInstruction } from "@solana/web3.js";

// Memo Program ID (same on mainnet and devnet)
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

/**
 * Create a memo instruction
 * @param message - The text message to write on-chain (max ~566 bytes)
 * @param signer - The public key that will sign this memo
 */
export function createMemoInstruction(
  message: string,
  signer: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [
      {
        pubkey: signer,
        isSigner: true,
        isWritable: false,
      },
    ],
    data: Buffer.from(message, "utf-8"),
  });
}

/**
 * Create a memo instruction without requiring a signer
 * (Still gets included in transaction signed by fee payer)
 */
export function createUnsignedMemoInstruction(
  message: string
): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(message, "utf-8"),
  });
}
