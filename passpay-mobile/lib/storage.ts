/**
 * Secure storage wrapper using Expo SecureStore
 * All sensitive data (credentials, wallet info) is stored securely
 */

import * as SecureStore from "expo-secure-store";
import { WalletInfo } from "../types";
import { STORAGE_KEYS } from "./constants";

/**
 * Store a value securely
 */
export async function securelyStore(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to store ${key}:`, error);
    throw new Error(`Failed to securely store data`);
  }
}

/**
 * Retrieve a value from secure storage
 */
export async function securelyRetrieve(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value from secure storage
 */
export async function securelyDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete ${key}:`, error);
  }
}

/**
 * Store wallet information securely
 */
export async function storeWalletInfo(wallet: WalletInfo): Promise<void> {
  try {
    await Promise.all([
      securelyStore(STORAGE_KEYS.CREDENTIAL_ID, wallet.credentialId),
      securelyStore(STORAGE_KEYS.WALLET_ADDRESS, wallet.smartWallet),
      securelyStore(STORAGE_KEYS.WALLET_DEVICE, wallet.walletDevice),
      securelyStore(STORAGE_KEYS.PLATFORM, wallet.platform),
      securelyStore(
        STORAGE_KEYS.PASSKEY_PUBKEY,
        JSON.stringify(wallet.passkeyPubkey)
      ),
      securelyStore(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()),
    ]);
  } catch (error) {
    console.error("Failed to store wallet info:", error);
    throw new Error("Failed to save wallet information");
  }
}

/**
 * Retrieve stored wallet information
 */
export async function retrieveWalletInfo(): Promise<WalletInfo | null> {
  try {
    const [
      credentialId,
      smartWallet,
      walletDevice,
      platform,
      passkeyPubkeyStr,
    ] = await Promise.all([
      securelyRetrieve(STORAGE_KEYS.CREDENTIAL_ID),
      securelyRetrieve(STORAGE_KEYS.WALLET_ADDRESS),
      securelyRetrieve(STORAGE_KEYS.WALLET_DEVICE),
      securelyRetrieve(STORAGE_KEYS.PLATFORM),
      securelyRetrieve(STORAGE_KEYS.PASSKEY_PUBKEY),
    ]);

    if (
      !credentialId ||
      !smartWallet ||
      !walletDevice ||
      !platform ||
      !passkeyPubkeyStr
    ) {
      return null;
    }

    const passkeyPubkey = JSON.parse(passkeyPubkeyStr);

    return {
      credentialId,
      smartWallet,
      walletDevice,
      platform,
      passkeyPubkey,
    };
  } catch (error) {
    console.error("Failed to retrieve wallet info:", error);
    return null;
  }
}

/**
 * Check if wallet is stored
 */
export async function hasStoredWallet(): Promise<boolean> {
  const credentialId = await securelyRetrieve(STORAGE_KEYS.CREDENTIAL_ID);
  return credentialId !== null;
}

/**
 * Clear all stored wallet data (logout)
 */
export async function clearWalletData(): Promise<void> {
  try {
    await Promise.all([
      securelyDelete(STORAGE_KEYS.CREDENTIAL_ID),
      securelyDelete(STORAGE_KEYS.WALLET_ADDRESS),
      securelyDelete(STORAGE_KEYS.WALLET_DEVICE),
      securelyDelete(STORAGE_KEYS.PLATFORM),
      securelyDelete(STORAGE_KEYS.PASSKEY_PUBKEY),
      securelyDelete(STORAGE_KEYS.LAST_LOGIN),
    ]);
  } catch (error) {
    console.error("Failed to clear wallet data:", error);
    throw new Error("Failed to logout");
  }
}

/**
 * Get last login timestamp
 */
export async function getLastLogin(): Promise<Date | null> {
  const lastLogin = await securelyRetrieve(STORAGE_KEYS.LAST_LOGIN);
  return lastLogin ? new Date(lastLogin) : null;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(): Promise<void> {
  await securelyStore(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
}
