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
export * from "@/feature-examples/transfer/services";
export * from "@/feature-examples/memo/services";
export * from "@/feature-examples/staking/services";
export * from "@/feature-examples/subscription/services";
export * from "@/feature-examples/session/services";
