/**
 * Native SOL Staking Service
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 📚 TUTORIAL: Staking SOL with Passkey Authentication
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This service demonstrates complex multi-instruction transactions:
 * - Create a stake account
 * - Delegate stake to a validator
 * - View existing stake accounts
 *
 * WHY USE createAccountWithSeed?
 * ------------------------------
 * Normally, creating a stake account requires a NEW keypair that must
 * sign the transaction. But LazorKit only provides the smart wallet signer.
 *
 * Solution: Use `createAccountWithSeed()` which derives the account address
 * from the wallet's public key + a seed string. This means:
 * - No additional signers needed!
 * - The stake account address is deterministic
 * - Works perfectly with LazorKit's passkey-only signing
 *
 * TRANSACTION STRUCTURE:
 * 1. StakeProgram.createAccountWithSeed() - Creates the stake account
 * 2. StakeProgram.delegate() - Delegates to chosen validator
 *
 * Both instructions are bundled into a single atomic transaction.
 */

import {
  Authorized,
  Connection,
  LAMPORTS_PER_SOL,
  Lockup,
  PublicKey,
  StakeProgram,
  TransactionInstruction,
} from "@solana/web3.js";

// Minimum stake amount (rent-exempt + buffer)
export const MIN_STAKE_AMOUNT = 0.01;

// Popular devnet validators (avoid expensive RPC call)
export const DEVNET_VALIDATORS = [
  {
    name: "Solana Foundation",
    identity: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
    voteAccount: "dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92",
  },
  {
    name: "Devnet Validator 1",
    identity: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
    voteAccount: "5D1fNXzvv5NjV1ysLjirC4WY92RNsVH18vjmcszZd8on",
  },
  {
    name: "Devnet Validator 2",
    identity: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
    voteAccount: "dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV",
  },
];

export interface StakeAccountInfo {
  address: string;
  lamports: number;
  state: "inactive" | "activating" | "active" | "deactivating";
  validator?: string;
}

/**
 * Get the rent-exempt minimum for a stake account
 */
export async function getStakeAccountRent(
  connection: Connection
): Promise<number> {
  return await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
}

/**
 * Create instructions to create and delegate a stake account
 *
 * USAGE WITH LAZORKIT:
 * ```typescript
 * const { instructions, stakeAccountPubkey } = await createStakeAccountInstructions(
 *   connection,
 *   smartWalletPubkey,
 *   1.0,  // Stake 1 SOL
 *   validatorVoteAccount
 * );
 *
 * await signAndSendTransaction({
 *   instructions,
 *   transactionOptions: { feeToken: 'USDC' }
 * });
 * ```
 *
 * NOTE: Uses createAccountWithSeed to avoid needing additional signers.
 */
export async function createStakeAccountInstructions(
  connection: Connection,
  fromPubkey: PublicKey,
  stakeAmount: number,
  validatorVoteAccount: PublicKey
): Promise<{
  instructions: TransactionInstruction[];
  stakeAccountPubkey: PublicKey;
  seed: string;
}> {
  const lamports = Math.floor(stakeAmount * LAMPORTS_PER_SOL);
  const rentExempt = await getStakeAccountRent(connection);

  // Use a timestamp-based seed for uniqueness
  const seed = `stake:${Date.now()}`;

  // Create stake account address using seed (no additional signer needed!)
  const stakeAccountPubkey = await PublicKey.createWithSeed(
    fromPubkey,
    seed,
    StakeProgram.programId
  );

  const instructions: TransactionInstruction[] = [];

  // 1. Create stake account with seed
  const createAccountInstruction = StakeProgram.createAccountWithSeed({
    fromPubkey,
    stakePubkey: stakeAccountPubkey,
    basePubkey: fromPubkey,
    seed,
    authorized: new Authorized(fromPubkey, fromPubkey),
    lockup: new Lockup(0, 0, fromPubkey), // No lockup
    lamports: lamports + rentExempt,
  });

  instructions.push(...createAccountInstruction.instructions);

  // 2. Delegate stake to validator
  const delegateInstruction = StakeProgram.delegate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey: fromPubkey,
    votePubkey: validatorVoteAccount,
  });

  instructions.push(...delegateInstruction.instructions);

  return {
    instructions,
    stakeAccountPubkey,
    seed,
  };
}

/**
 * Create instruction to deactivate a stake account
 */
export function createDeactivateStakeInstruction(
  stakeAccountPubkey: PublicKey,
  authorizedPubkey: PublicKey
): TransactionInstruction[] {
  const deactivateTx = StakeProgram.deactivate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey,
  });
  return deactivateTx.instructions;
}

/**
 * Create instruction to withdraw from a deactivated stake account
 */
export function createWithdrawStakeInstruction(
  stakeAccountPubkey: PublicKey,
  authorizedPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number
): TransactionInstruction[] {
  const withdrawTx = StakeProgram.withdraw({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey,
    toPubkey,
    lamports,
  });
  return withdrawTx.instructions;
}

/**
 * Get all stake accounts for a wallet
 */
export async function getStakeAccounts(
  connection: Connection,
  walletAddress: PublicKey
): Promise<StakeAccountInfo[]> {
  try {
    const stakeAccounts = await connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [
          {
            memcmp: {
              offset: 12,
              bytes: walletAddress.toBase58(),
            },
          },
        ],
      }
    );

    return stakeAccounts.map((account) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = (account.account.data as any).parsed;
      const info = parsed?.info;
      const stake = info?.stake;

      let state: StakeAccountInfo["state"] = "inactive";
      if (stake?.delegation) {
        const deactivation = stake.delegation.deactivationEpoch;
        const activation = stake.delegation.activationEpoch;

        if (deactivation !== "18446744073709551615") {
          state = "deactivating";
        } else if (activation !== "18446744073709551615") {
          state = "active";
        } else {
          state = "activating";
        }
      }

      return {
        address: account.pubkey.toBase58(),
        lamports: account.account.lamports,
        state,
        validator: stake?.delegation?.voter,
      };
    });
  } catch (error) {
    console.error("Error fetching stake accounts:", error);
    return [];
  }
}

/**
 * Format lamports to SOL with decimals
 */
export function formatSol(lamports: number, decimals: number = 4): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(decimals);
}

/**
 * Get state badge color
 */
export function getStateBadgeColor(state: StakeAccountInfo["state"]): string {
  switch (state) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/40";
    case "activating":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    case "deactivating":
      return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    default:
      return "bg-neutral-500/20 text-neutral-400 border-neutral-500/40";
  }
}
