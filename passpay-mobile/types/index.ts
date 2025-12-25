/**
 * Type definitions for PassPay Mobile App
 */

import {
  AddressLookupTableAccount,
  TransactionInstruction,
} from "@solana/web3.js";

// Lazorkit Wallet Information
export interface WalletInfo {
  readonly credentialId: string; // Unique WebAuthn credential ID (Base64)
  readonly passkeyPubkey: number[]; // Raw public key bytes of the passkey
  readonly smartWallet: string; // Solana wallet address (Base58)
  readonly walletDevice: string; // Internal PDA for device management
  readonly platform: string; // Origin platform ('android' | 'ios')
}

// Transaction payload for Lazorkit
export interface SignAndSendTransactionPayload {
  readonly instructions: TransactionInstruction[];
  readonly transactionOptions: {
    readonly feeToken?: string;
    readonly addressLookupTableAccounts?: AddressLookupTableAccount[];
    readonly computeUnitLimit?: number;
    readonly clusterSimulation: "devnet" | "mainnet";
  };
}

// Transaction history item
export interface Transaction {
  signature: string;
  timestamp: number;
  type: "send" | "receive";
  amount: number;
  token: "SOL" | "USDC";
  from: string;
  to: string;
  status: "confirmed" | "pending" | "failed";
}

// Biometric authentication result
export interface BiometricAuthResult {
  success: boolean;
  error?:
    | "user_cancel"
    | "lockout"
    | "not_available"
    | "not_enrolled"
    | "unknown";
}

// Biometric types supported
export type BiometricType =
  | "FaceID"
  | "TouchID"
  | "Fingerprint"
  | "Iris"
  | "PIN"
  | "None";

// Send transaction form data
export interface SendFormData {
  recipientAddress: string;
  amount: string;
  memo?: string;
}

// Wallet creation result
export interface WalletCreationResult {
  walletAddress: string;
  credentialId: string;
  success: boolean;
  error?: string;
}

// Balance information
export interface BalanceInfo {
  sol: number;
  usdc: number;
  lastUpdated: number;
}

// Secure storage keys
export enum SecureStoreKeys {
  CREDENTIAL_ID = "lazorkit_credential",
  WALLET_ADDRESS = "wallet_address",
  WALLET_DEVICE = "wallet_device",
  PLATFORM = "platform",
  PASSKEY_PUBKEY = "passkey_pubkey",
}

// Navigation params
export type RootStackParamList = {
  "(onboarding)/welcome": undefined;
  "(onboarding)/create-wallet": undefined;
  "(tabs)": undefined;
  send: undefined;
  "scan-qr": { onScan: (address: string) => void };
  "transaction-success": { signature: string; amount: number };
};

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class WalletError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "WalletError";
  }
}

export class BiometricError extends Error {
  type:
    | "user_cancel"
    | "lockout"
    | "not_available"
    | "not_enrolled"
    | "unknown";

  constructor(type: BiometricError["type"], message: string) {
    super(message);
    this.type = type;
    this.name = "BiometricError";
  }
}

export class TransactionError extends Error {
  signature?: string;

  constructor(message: string, signature?: string) {
    super(message);
    this.signature = signature;
    this.name = "TransactionError";
  }
}
