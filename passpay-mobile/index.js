/**
 * Custom entry point for the app
 *
 * This file ensures polyfills are loaded BEFORE expo-router initializes,
 * which is critical for Solana libraries that require Buffer.
 */

// Load polyfills first
import "./polyfills";

// Then load the expo-router entry
import "expo-router/entry";
