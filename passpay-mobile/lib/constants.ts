/**
 * Application constants and configuration
 */

import { PublicKey } from "@solana/web3.js";

// Solana Configuration
export const SOLANA_CONFIG = {
  RPC_URL:
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  CLUSTER: (process.env.EXPO_PUBLIC_CLUSTER || "devnet") as
    | "devnet"
    | "mainnet",
  USDC_MINT: new PublicKey(
    process.env.EXPO_PUBLIC_USDC_MINT ||
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // Devnet USDC
  ),
} as const;

// Lazorkit Configuration
export const LAZORKIT_CONFIG = {
  PORTAL_URL:
    process.env.EXPO_PUBLIC_LAZORKIT_PORTAL_URL || "https://portal.lazor.sh",
  PAYMASTER_URL:
    process.env.EXPO_PUBLIC_LAZORKIT_PAYMASTER_URL ||
    "https://kora.devnet.lazorkit.com",
  API_KEY: process.env.EXPO_PUBLIC_LAZORKIT_API_KEY,
} as const;

// App Configuration
export const APP_CONFIG = {
  SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME || "passpay",
  REDIRECT_URL: `${process.env.EXPO_PUBLIC_APP_SCHEME || "passpay"}://home`,
  CALLBACK_URL: `${process.env.EXPO_PUBLIC_APP_SCHEME || "passpay"}://callback`,
} as const;

// UI Colors (Solana-themed)
export const COLORS = {
  primary: "#14F195", // Solana green
  background: "#000000", // Black
  card: "#1A1A1A", // Dark gray
  cardHover: "#2A2A2A", // Lighter gray
  text: "#FFFFFF", // White
  textSecondary: "#8F8F8F", // Gray
  success: "#10B981", // Green
  error: "#EF4444", // Red
  warning: "#F59E0B", // Amber
  border: "#333333", // Border gray
  transparent: "transparent",
} as const;

// Typography
export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Transaction limits
export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 0.000001,
  MAX_AMOUNT: 1000000,
  DECIMALS: 6, // USDC has 6 decimals
} as const;

// Validation patterns
export const VALIDATION = {
  SOLANA_ADDRESS_REGEX: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
} as const;

// Animation durations (ms)
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Network timeouts
export const TIMEOUTS = {
  TRANSACTION: 60000, // 60 seconds
  BALANCE_FETCH: 10000, // 10 seconds
  CONNECTION: 5000, // 5 seconds
} as const;

// Biometric settings
export const BIOMETRIC_CONFIG = {
  PROMPT_MESSAGE: "Authenticate to access your wallet",
  TRANSACTION_PROMPT: "Confirm transaction",
  FALLBACK_LABEL: "Use PIN",
  MAX_ATTEMPTS: 3,
} as const;

// Storage keys (centralized for easy reference)
export const STORAGE_KEYS = {
  CREDENTIAL_ID: "lazorkit_credential",
  WALLET_ADDRESS: "wallet_address",
  WALLET_DEVICE: "wallet_device",
  PLATFORM: "platform",
  PASSKEY_PUBKEY: "passkey_pubkey",
  LAST_LOGIN: "last_login",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  BIOMETRIC_NOT_AVAILABLE:
    "Biometric authentication is not available on this device",
  BIOMETRIC_NOT_ENROLLED:
    "Please set up Face ID or Touch ID in your device settings",
  BIOMETRIC_LOCKOUT: "Too many failed attempts. Please try again later",
  BIOMETRIC_CANCELLED: "Authentication was cancelled",
  WALLET_NOT_FOUND: "No wallet found. Please create a new wallet",
  INVALID_ADDRESS: "Please enter a valid Solana address",
  INSUFFICIENT_BALANCE: "Insufficient balance",
  TRANSACTION_FAILED: "Transaction failed. Please try again",
  NETWORK_ERROR: "Network error. Please check your connection",
  UNKNOWN_ERROR: "An unknown error occurred",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: "Wallet created successfully!",
  TRANSACTION_SENT: "Transaction sent successfully!",
  ADDRESS_COPIED: "Address copied to clipboard",
} as const;

// Solscan URLs
export const SOLSCAN_URL = {
  devnet: "https://solscan.io",
  mainnet: "https://solscan.io",
} as const;

export const getExplorerUrl = (
  signature: string,
  cluster: "devnet" | "mainnet" = "devnet"
) => {
  const baseUrl = SOLSCAN_URL[cluster];
  const clusterParam = cluster === "devnet" ? "?cluster=devnet" : "";
  return `${baseUrl}/tx/${signature}${clusterParam}`;
};

// Helper to format Solana addresses
export const formatAddress = (address: string, chars: number = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Helper to format USDC amounts
export const formatUSDC = (amount: number): string => {
  return amount.toFixed(2);
};

// Helper to format SOL amounts
export const formatSOL = (lamports: number): string => {
  return (lamports / 1e9).toFixed(4);
};
