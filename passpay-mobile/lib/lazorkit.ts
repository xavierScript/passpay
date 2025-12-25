/**
 * Lazorkit SDK integration for React Native
 * Handles wallet creation, transactions, and balance queries
 */

import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  BalanceInfo,
  Transaction,
  TransactionError,
  WalletCreationResult,
  WalletInfo,
} from "../types";
import { requireBiometricAuth } from "./biometric";
import { APP_CONFIG, SOLANA_CONFIG, TIMEOUTS } from "./constants";
import { retrieveWalletInfo } from "./storage";

/**
 * Lazorkit Manager Class
 * Wraps Lazorkit SDK calls with biometric authentication and error handling
 */
export class LazorkitManager {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_CONFIG.RPC_URL, "confirmed");
  }

  /**
   * Create a new passkey wallet with biometric authentication
   * This is called during onboarding
   */
  async createWalletWithBiometric(
    connectFn: (options: any) => Promise<void>,
    walletInfo: WalletInfo | null
  ): Promise<WalletCreationResult> {
    try {
      // Prompt biometric authentication before creating wallet
      await requireBiometricAuth("Authenticate to create your wallet");

      // If wallet already exists, return it
      if (walletInfo) {
        return {
          walletAddress: walletInfo.smartWallet,
          credentialId: walletInfo.credentialId,
          success: true,
        };
      }

      // Create new wallet via Lazorkit SDK
      // The connect function will open the portal and create the passkey
      await connectFn({
        redirectUrl: APP_CONFIG.REDIRECT_URL,
      });

      // Wait for wallet to be connected (this is handled by the SDK)
      // The wallet info will be available after successful connection
      return {
        walletAddress: "",
        credentialId: "",
        success: true,
      };
    } catch (error: any) {
      console.error("Failed to create wallet:", error);
      return {
        walletAddress: "",
        credentialId: "",
        success: false,
        error: error.message || "Failed to create wallet",
      };
    }
  }

  /**
   * Restore wallet from stored credentials
   */
  async restoreWallet(): Promise<WalletInfo | null> {
    try {
      const walletInfo = await retrieveWalletInfo();
      return walletInfo;
    } catch (error) {
      console.error("Failed to restore wallet:", error);
      return null;
    }
  }

  /**
   * Get USDC balance for a wallet
   */
  async getUSDCBalance(walletAddress: string): Promise<number> {
    try {
      const pubkey = new PublicKey(walletAddress);

      // Get token account for USDC
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        pubkey,
        { mint: SOLANA_CONFIG.USDC_MINT }
      );

      if (tokenAccounts.value.length === 0) {
        return 0;
      }

      const balance =
        tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      return balance || 0;
    } catch (error) {
      console.error("Failed to fetch USDC balance:", error);
      return 0;
    }
  }

  /**
   * Get SOL balance for a wallet
   */
  async getSOLBalance(walletAddress: string): Promise<number> {
    try {
      const pubkey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Failed to fetch SOL balance:", error);
      return 0;
    }
  }

  /**
   * Get combined balance information
   */
  async getBalances(walletAddress: string): Promise<BalanceInfo> {
    try {
      const [sol, usdc] = await Promise.all([
        this.getSOLBalance(walletAddress),
        this.getUSDCBalance(walletAddress),
      ]);

      return {
        sol,
        usdc,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      return {
        sol: 0,
        usdc: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Send gasless USDC with biometric confirmation
   */
  async sendUSDCWithBiometric(
    amount: number,
    recipient: string,
    signAndSendFn: (payload: any, options: any) => Promise<string>,
    fromAddress: string
  ): Promise<string> {
    try {
      // Validate recipient address
      if (!this.isValidSolanaAddress(recipient)) {
        throw new TransactionError("Invalid recipient address");
      }

      // Validate amount
      if (amount <= 0) {
        throw new TransactionError("Amount must be greater than 0");
      }

      // Prompt biometric confirmation
      await requireBiometricAuth(`Confirm sending ${amount.toFixed(2)} USDC`);

      // Create USDC transfer instruction
      // Note: This is a simplified example. In production, you'd use SPL Token program
      const fromPubkey = new PublicKey(fromAddress);
      const toPubkey = new PublicKey(recipient);

      // For demonstration, we'll use a system transfer
      // In production, replace with actual SPL Token transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      });

      // Sign and send transaction with Lazorkit
      const signature = await signAndSendFn(
        {
          instructions: [instruction],
          transactionOptions: {
            feeToken: "USDC", // Use USDC for gas fees (gasless for user)
            computeUnitLimit: 200_000,
            clusterSimulation: SOLANA_CONFIG.CLUSTER,
          },
        },
        {
          redirectUrl: APP_CONFIG.CALLBACK_URL,
        }
      );

      return signature;
    } catch (error: any) {
      console.error("Failed to send USDC:", error);
      throw new TransactionError(
        error.message || "Transaction failed. Please try again."
      );
    }
  }

  /**
   * Get recent transactions for a wallet
   */
  async getRecentTransactions(
    walletAddress: string,
    limit: number = 5
  ): Promise<Transaction[]> {
    try {
      const pubkey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        limit,
      });

      const transactions: Transaction[] = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx) {
            return null;
          }

          // Parse transaction details
          const instruction = tx.transaction.message.instructions[0];
          const accountKeys = tx.transaction.message.accountKeys;

          return {
            signature: sig.signature,
            timestamp: (tx.blockTime || 0) * 1000,
            type:
              accountKeys[0].pubkey.toString() === walletAddress
                ? "send"
                : "receive",
            amount: 0, // Parse from instruction data
            token: "SOL",
            from: accountKeys[0].pubkey.toString(),
            to: accountKeys[1]?.pubkey.toString() || "",
            status:
              sig.confirmationStatus === "finalized" ? "confirmed" : "pending",
          } as Transaction;
        })
      );

      return transactions.filter((tx): tx is Transaction => tx !== null);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      return [];
    }
  }

  /**
   * Validate Solana address format
   */
  isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    signature: string,
    timeout: number = TIMEOUTS.TRANSACTION
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.connection.getSignatureStatus(signature);

        if (
          status.value?.confirmationStatus === "confirmed" ||
          status.value?.confirmationStatus === "finalized"
        ) {
          return true;
        }

        if (status.value?.err) {
          throw new Error("Transaction failed");
        }

        // Wait 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error checking transaction status:", error);
      }
    }

    throw new Error("Transaction confirmation timeout");
  }
}

// Singleton instance
export const lazorkitManager = new LazorkitManager();
