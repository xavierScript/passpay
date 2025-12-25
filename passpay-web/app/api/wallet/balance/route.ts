import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import type { ApiResponse } from "@/types";
import { USDC_MINT } from "@/lib/constants";
import { getEnv } from "@/lib/env";

/**
 * GET /api/wallet/balance?wallet=<address>
 * Returns USDC balance for the given wallet.
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
    const mint = new PublicKey(USDC_MINT);
    const ata = await getAssociatedTokenAddress(mint, wallet);

    const balance = await connection.getTokenAccountBalance(ata);
    const usdcBalance = parseFloat(balance.value.uiAmount?.toFixed(2) || "0");

    return NextResponse.json<ApiResponse<{ balance: number }>>({
      ok: true,
      data: { balance: usdcBalance },
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
