/**
 * Polyfills for React Native / Expo
 *
 * This file must be imported FIRST in the app entry point (_layout.tsx)
 * before any other imports that might use Buffer, crypto, or URL.
 */

import { Buffer } from "buffer";

// Buffer polyfill - must be set before any Solana libraries are imported
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

// Crypto polyfill for getRandomValues
import "react-native-get-random-values";

// URL polyfill
import "react-native-url-polyfill/auto";
