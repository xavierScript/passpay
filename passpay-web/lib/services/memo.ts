/**
 * Memo Program Service
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Writing Permanent Messages on Solana
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Memo program is one of Solana's simplest programs. It allows you to
 * write arbitrary text data on-chain permanently. This is perfect for:
 *
 * - Proof of existence / timestamps
 * - Transaction annotations
 * - On-chain notes and messages
 * - Simple "hello world" for LazorKit integration testing
 *
 * KEY CONCEPTS:
 * - MEMO_PROGRAM_ID: Same on mainnet and devnet
 * - Messages are stored in transaction logs, not separate accounts
 * - Max ~566 bytes per memo (varies with transaction size)
 *
 * This is the simplest LazorKit integration - if this works, your
 * setup is correct!
 */

import { PublicKey, TransactionInstruction } from "@solana/web3.js";

// Memo Program ID (same on mainnet and devnet)
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

/**
 * Create a memo instruction (signed)
 *
 * USAGE WITH LAZORKIT:
 * ```typescript
 * const instruction = createMemoInstruction(
 *   "Hello, Solana!",
 *   smartWalletPubkey
 * );
 *
 * await signAndSendTransaction({
 *   instructions: [instruction],
 *   transactionOptions: { feeToken: 'USDC' }
 * });
 * ```
 *
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

/**
 * Validate memo message
 * @returns Error message if invalid, null if valid
 */
export function validateMemo(message: string): string | null {
  if (!message.trim()) {
    return "Please enter a message";
  }
  if (message.length > 500) {
    return "Message too long. Maximum 500 characters.";
  }
  return null;
}
