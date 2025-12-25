import type { PublicKey, TransactionInstruction } from "@solana/web3.js";
import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableAccount,
  PublicKey as SolanaPublicKey,
} from "@solana/web3.js";
import { getEnv } from "./env";
import { USDC_MINT } from "./constants";
import {
  getAssociatedTokenAddress,
  createTransferCheckedInstruction,
} from "@solana/spl-token";

/**
 * JSDoc: LazorkitManager wraps core Lazorkit flows to keep app code clean.
 * Note: This class is intended for client-side usage with Lazorkit's React hook.
 */
export class LazorkitManager {
  private signAndSendTransaction: (payload: {
    instructions: TransactionInstruction[];
    transactionOptions?: {
      feeToken?: string;
      addressLookupTableAccounts?: AddressLookupTableAccount[];
      computeUnitLimit?: number;
      clusterSimulation?: "devnet" | "mainnet";
    };
  }) => Promise<string>;
  private smartWalletPubkey?: PublicKey;

  constructor(opts: {
    signAndSendTransaction: LazorkitManager["signAndSendTransaction"];
    smartWalletPubkey?: PublicKey;
  }) {
    this.signAndSendTransaction = opts.signAndSendTransaction;
    this.smartWalletPubkey = opts.smartWalletPubkey;
  }

  /**
   * Create a passkey-based wallet by triggering Lazorkit connect flow.
   * Use Lazorkit React hook `connect()` in UI, not here. This method returns WalletResponse shape.
   */
  async createPasskeyWallet(
    username: string
  ): Promise<
    { accountName?: string } & { smartWallet: string; credentialId: string }
  > {
    // In this demo, the actual creation is handled by LazorkitProvider connect().
    // We return a placeholder merging username for demonstration.
    return {
      accountName: username,
      smartWallet: this.smartWalletPubkey?.toBase58() || "",
      credentialId: "",
    };
  }

  /** Initialize the smart wallet pubkey after authentication. */
  async initSmartWallet(
    passkeyCredential: string
  ): Promise<{ address: string }> {
    if (!this.smartWalletPubkey) throw new Error("Wallet not connected");
    return { address: this.smartWalletPubkey.toBase58() };
  }

  /**
   * Approve recurring payment via a delegated policy (conceptual for demo).
   * In production, you'd set a policy on Lazorkit's on-chain program; here we simulate by signing a message.
   */
  async approveRecurringPayment(
    amount: number,
    intervalSeconds: number,
    recipient: string
  ): Promise<{ approvalId: string }> {
    // A lightweight on-chain approval can be implemented via program instruction.
    // For demo purposes, we record an approvalId based on inputs.
    const approvalId = `appr_${amount}_${intervalSeconds}_${recipient}`;
    return { approvalId };
  }

  /** Execute a gasless USDC transfer using Paymaster sponsorship. */
  async transferUSDC(amount: number, recipient: string): Promise<string> {
    if (!this.smartWalletPubkey) throw new Error("Wallet not connected");

    const env = getEnv();
    const mint = new SolanaPublicKey(USDC_MINT);
    const fromAta = await getAssociatedTokenAddress(
      mint,
      this.smartWalletPubkey
    );
    const toPubkey = new SolanaPublicKey(recipient);
    const toAta = await getAssociatedTokenAddress(mint, toPubkey);

    const decimals = 6; // USDC decimals
    const instruction = createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      this.smartWalletPubkey,
      amount * 10 ** decimals,
      decimals
    );

    const signature = await this.signAndSendTransaction({
      instructions: [instruction],
      transactionOptions: {
        feeToken: "USDC",
        computeUnitLimit: 500_000,
        clusterSimulation: env.NEXT_PUBLIC_SOLANA_RPC_URL.includes("mainnet")
          ? "mainnet"
          : "devnet",
      },
    });
    return signature;
  }

  /** Check approval status (conceptual). */
  async checkApprovalStatus(_walletAddress: string): Promise<boolean> {
    // In a real app, query the Lazorkit program or your backend.
    return true;
  }

  async revokeApproval(approvalId: string): Promise<void> {
    // Revoke on-chain delegation; here we only simulate.
    void approvalId;
  }

  /** Query USDC balance by reading ATA (delegated to API in this demo). */
  async getUSDCBalance(_walletAddress: string): Promise<number> {
    // For simplicity, the app calls backend `/api/wallet/balance`.
    return 0;
  }
}
