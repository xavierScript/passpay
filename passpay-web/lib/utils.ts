/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Crypto API has strict generic types that conflict with BufferSource

/** AES-GCM encryption helpers for storing passkey credentialId locally. */
export async function encryptLocal(data: string): Promise<string> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const secretSeed = await subtleKeyFromDeviceInfo(salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    secretSeed,
    enc.encode(data)
  );
  const out = new Uint8Array(cipher);
  return `${bufferToBase64(iv)}.${bufferToBase64(salt)}.${bufferToBase64(out)}`;
}

export async function decryptLocal(payload: string): Promise<string | null> {
  try {
    const [ivB64, saltB64, dataB64] = payload.split(".");
    const iv = base64ToBuffer(ivB64);
    const salt = base64ToBuffer(saltB64);
    const data = base64ToBuffer(dataB64);
    const key = await subtleKeyFromDeviceInfo(salt);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

async function subtleKeyFromDeviceInfo(salt: Uint8Array): Promise<CryptoKey> {
  const device = navigator.userAgent + (navigator.platform || "web");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(device),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}
function base64ToBuffer(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/** Retry utility with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > retries) throw e;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
}
