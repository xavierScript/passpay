/**
 * Services Index
 *
 * Re-export all services for convenient imports.
 * Services are now organized by feature but re-exported here for backward compatibility.
 *
 * Usage:
 * import { createTransferInstruction, createMemoInstruction } from '@/lib/services';
 */

// Shared services
export * from "./rpc";

// Feature services (re-exported for backward compatibility)
export * from "@/features/transfer/services";
export * from "@/features/memo/services";
export * from "@/features/staking/services";
export * from "@/features/subscription/services";
