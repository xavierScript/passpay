/**
 * Native SOL Staking Service
 *
 * This service handles staking SOL to validators using Solana's native
 * Stake Program. Users can delegate SOL to earn staking rewards.
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

// Minimum stake amount (0.01 SOL for rent + some buffer)
export const MIN_STAKE_AMOUNT = 0.01;

// Popular devnet validators
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
 * This creates a new stake account and delegates it to a validator.
 * The stake account keypair needs to sign, so we return it for pre-signing.
 *
 * NOTE: Since LazorKit doesn't support additional signers, we use a
 * deterministic approach - derive a PDA-like address or use the
 * "createAccountWithSeed" approach which doesn't need extra signers.
 */
export async function createStakeAccountInstructions(
  connection: Connection,
  fromPubkey: PublicKey,
  stakeAmount: number, // in SOL
  validatorVoteAccount: PublicKey
): Promise<{
  instructions: TransactionInstruction[];
  stakeAccountPubkey: PublicKey;
  seed: string;
}> {
  const lamports = stakeAmount * LAMPORTS_PER_SOL;
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
  const stakeAccounts = await connection.getParsedProgramAccounts(
    StakeProgram.programId,
    {
      filters: [
        {
          memcmp: {
            offset: 12, // Offset to staker authority
            bytes: walletAddress.toBase58(),
          },
        },
      ],
    }
  );

  return stakeAccounts.map((account) => {
    const parsed = (account.account.data as any).parsed;
    const info = parsed?.info;
    const stake = info?.stake;

    let state: StakeAccountInfo["state"] = "inactive";
    if (stake?.delegation) {
      const activation = stake.delegation.activationEpoch;
      const deactivation = stake.delegation.deactivationEpoch;

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
}

/**
 * Get current validator list from the network
 */
export async function getValidators(
  connection: Connection
): Promise<{ voteAccount: string; nodePubkey: string; stake: number }[]> {
  try {
    const { current } = await connection.getVoteAccounts();
    return current
      .sort((a, b) => b.activatedStake - a.activatedStake)
      .slice(0, 10) // Top 10 validators
      .map((v) => ({
        voteAccount: v.votePubkey,
        nodePubkey: v.nodePubkey,
        stake: v.activatedStake / LAMPORTS_PER_SOL,
      }));
  } catch (error) {
    console.error("Error fetching validators:", error);
    return [];
  }
}
