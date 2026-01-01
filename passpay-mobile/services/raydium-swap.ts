/**
 * Raydium Swap Service for Devnet
 *
 * This service handles token swaps using Raydium's Trade API.
 * It fetches quotes, builds swap transactions, and prepares instructions
 * for signing via LazorKit smart wallet.
 */

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import axios from "axios";

// Raydium API endpoints
const RAYDIUM_API_URLS = {
  BASE_HOST: "https://api-v3.raydium.io",
  SWAP_HOST: "https://transaction-v1.raydium.io",
  PRIORITY_FEE: "/main/auto-fee",
};

// Token addresses for devnet
export const DEVNET_TOKENS = {
  SOL: "So11111111111111111111111111111111111111112", // Wrapped SOL (Native Mint)
  USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // Devnet USDC
  RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY token
};

// Token metadata for UI
export const TOKEN_INFO: Record<
  string,
  { symbol: string; name: string; decimals: number; logoUri?: string }
> = {
  [DEVNET_TOKENS.SOL]: {
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
  },
  [DEVNET_TOKENS.USDC]: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  [DEVNET_TOKENS.RAY]: {
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
  },
};

export interface SwapQuote {
  id: string;
  success: boolean;
  version: "V0" | "V1";
  data: {
    swapType: "BaseIn" | "BaseOut";
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    routePlan: {
      poolId: string;
      inputMint: string;
      outputMint: string;
      feeMint: string;
      feeRate: number;
      feeAmount: string;
    }[];
  };
}

export interface PriorityFeeResponse {
  id: string;
  success: boolean;
  data: {
    default: {
      vh: number; // very high
      h: number; // high
      m: number; // medium
    };
  };
}

export interface SwapTransactionResponse {
  id: string;
  version: string;
  success: boolean;
  data: { transaction: string }[];
}

/**
 * Get the priority fee from Raydium API
 */
export async function getPriorityFee(): Promise<PriorityFeeResponse["data"]> {
  try {
    const { data } = await axios.get<PriorityFeeResponse>(
      `${RAYDIUM_API_URLS.BASE_HOST}${RAYDIUM_API_URLS.PRIORITY_FEE}`
    );
    return data.data;
  } catch (error) {
    console.error("Failed to get priority fee:", error);
    // Return default values if API fails
    return {
      default: {
        vh: 100000,
        h: 50000,
        m: 25000,
      },
    };
  }
}

/**
 * Get a swap quote from Raydium API
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string, // Amount in smallest units (lamports for SOL)
  slippageBps: number = 50 // 0.5% default slippage
): Promise<SwapQuote> {
  const txVersion = "V0"; // Use versioned transactions

  const url = `${RAYDIUM_API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&txVersion=${txVersion}`;

  console.log("Fetching swap quote:", url);

  const { data } = await axios.get<SwapQuote>(url);

  if (!data.success) {
    throw new Error("Failed to get swap quote from Raydium");
  }

  return data;
}

/**
 * Get the swap transaction from Raydium API
 */
export async function getSwapTransaction(
  swapQuote: SwapQuote,
  walletAddress: string,
  inputMint: string,
  outputMint: string,
  inputTokenAccount?: string,
  outputTokenAccount?: string
): Promise<SwapTransactionResponse> {
  const txVersion = "V0";
  const isInputSol = inputMint === DEVNET_TOKENS.SOL;
  const isOutputSol = outputMint === DEVNET_TOKENS.SOL;

  // Get priority fee
  const priorityFee = await getPriorityFee();

  const payload = {
    computeUnitPriceMicroLamports: String(priorityFee.default.h),
    swapResponse: swapQuote,
    txVersion,
    wallet: walletAddress,
    wrapSol: isInputSol,
    unwrapSol: isOutputSol,
    inputAccount: isInputSol ? undefined : inputTokenAccount,
    outputAccount: isOutputSol ? undefined : outputTokenAccount,
  };

  console.log("Getting swap transaction with payload:", payload);

  const { data } = await axios.post<SwapTransactionResponse>(
    `${RAYDIUM_API_URLS.SWAP_HOST}/transaction/swap-base-in`,
    payload
  );

  if (!data.success) {
    throw new Error("Failed to get swap transaction from Raydium");
  }

  return data;
}

/**
 * Deserialize a versioned transaction from base64
 */
export function deserializeTransaction(
  base64Transaction: string
): VersionedTransaction {
  const buffer = Buffer.from(base64Transaction, "base64");
  return VersionedTransaction.deserialize(buffer);
}

/**
 * Extract instructions from a versioned transaction
 * Note: This is a simplified approach. For complex transactions,
 * we may need to handle this differently with LazorKit.
 */
export function extractInstructionsFromVersionedTx(
  transaction: VersionedTransaction
): TransactionInstruction[] {
  const message = transaction.message;
  const instructions: TransactionInstruction[] = [];

  // Get account keys
  const accountKeys = message.staticAccountKeys;

  // Extract instructions from the compiled message
  for (const compiledInstruction of message.compiledInstructions) {
    const programId = accountKeys[compiledInstruction.programIdIndex];

    const keys = compiledInstruction.accountKeyIndexes.map((index) => ({
      pubkey: accountKeys[index],
      isSigner: message.isAccountSigner(index),
      isWritable: message.isAccountWritable(index),
    }));

    const instruction = new TransactionInstruction({
      programId,
      keys,
      data: Buffer.from(compiledInstruction.data),
    });

    instructions.push(instruction);
  }

  return instructions;
}

/**
 * Get or create the associated token account address for a given mint
 */
export async function getTokenAccountAddress(
  walletAddress: PublicKey,
  mintAddress: PublicKey
): Promise<PublicKey> {
  return getAssociatedTokenAddress(
    mintAddress,
    walletAddress,
    true, // allowOwnerOffCurve - important for PDAs
    TOKEN_PROGRAM_ID
  );
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  amount: string,
  decimals: number,
  displayDecimals: number = 4
): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  return value.toFixed(displayDecimals);
}

/**
 * Parse user input amount to smallest units
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return "0";
  return Math.floor(value * Math.pow(10, decimals)).toString();
}

/**
 * Main swap function that orchestrates the entire swap process
 * Returns the instructions to be signed and sent via LazorKit
 */
export async function prepareSwapInstructions(
  connection: Connection,
  walletAddress: string,
  inputMint: string,
  outputMint: string,
  inputAmount: string, // In smallest units
  slippageBps: number = 50
): Promise<{
  quote: SwapQuote;
  transactions: VersionedTransaction[];
}> {
  // Get swap quote
  const quote = await getSwapQuote(
    inputMint,
    outputMint,
    inputAmount,
    slippageBps
  );

  console.log("Got swap quote:", {
    inputAmount: quote.data.inputAmount,
    outputAmount: quote.data.outputAmount,
    priceImpact: quote.data.priceImpactPct,
  });

  // Get token accounts if needed
  const walletPubkey = new PublicKey(walletAddress);
  let inputTokenAccount: string | undefined;
  let outputTokenAccount: string | undefined;

  if (inputMint !== DEVNET_TOKENS.SOL) {
    inputTokenAccount = (
      await getTokenAccountAddress(walletPubkey, new PublicKey(inputMint))
    ).toBase58();
  }

  if (outputMint !== DEVNET_TOKENS.SOL) {
    outputTokenAccount = (
      await getTokenAccountAddress(walletPubkey, new PublicKey(outputMint))
    ).toBase58();
  }

  // Get swap transaction
  const swapTxResponse = await getSwapTransaction(
    quote,
    walletAddress,
    inputMint,
    outputMint,
    inputTokenAccount,
    outputTokenAccount
  );

  // Deserialize transactions
  const transactions = swapTxResponse.data.map((tx) =>
    deserializeTransaction(tx.transaction)
  );

  console.log(`Prepared ${transactions.length} transaction(s) for swap`);

  return { quote, transactions };
}
