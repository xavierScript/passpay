import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { ApiResponse } from "@/types";
import { USDC_MINT } from "@/lib/constants";
import { getEnv } from "@/lib/env";

/**
 * GET /api/wallet/balance?wallet=<address>
 * Returns SOL and USDC balance for the given wallet.
 */
export async function GET(req: NextRequest) {
  try {
    const walletParam = req.nextUrl.searchParams.get("wallet");
    if (!walletParam) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Missing wallet parameter" },
        { status: 400 }
      );
    }

    const env = getEnv();
    const connection = new Connection(
      env.NEXT_PUBLIC_SOLANA_RPC_URL,
      "confirmed"
    );
    const wallet = new PublicKey(walletParam);

    // Get SOL balance
    const solBalance = await connection.getBalance(wallet);
    const solAmount = solBalance / 1e9; // Convert lamports to SOL

    // Get USDC balance
    const mint = new PublicKey(USDC_MINT);
    const ata = await getAssociatedTokenAddress(mint, wallet);
    let usdcBalance = 0;

    // Check if token account exists
    const accountInfo = await connection.getAccountInfo(ata);
    if (accountInfo) {
      const balance = await connection.getTokenAccountBalance(ata);
      usdcBalance = parseFloat(balance.value.uiAmount?.toFixed(2) || "0");
    }

    return NextResponse.json<
      ApiResponse<{ balance: number; solBalance: number; usdcBalance: number }>
    >({
      ok: true,
      data: {
        balance: usdcBalance, // Keep for backward compatibility
        solBalance: solAmount,
        usdcBalance: usdcBalance,
      },
    });
  } catch (error: any) {
    console.error("Balance API error:", error);
    // Return 0 balances on error
    return NextResponse.json<
      ApiResponse<{ balance: number; solBalance: number; usdcBalance: number }>
    >({
      ok: true,
      data: { balance: 0, solBalance: 0, usdcBalance: 0 },
    });
  }
}
