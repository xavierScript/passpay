import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

/**
 * POST /api/subscription/cancel
 * Cancels the subscription by revoking the smart wallet approval.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Missing walletAddress" },
        { status: 400 }
      );
    }

    // TODO: Revoke on-chain approval via Lazorkit
    // TODO: Update subscription status in database

    return NextResponse.json<ApiResponse<{ cancelled: boolean }>>({
      ok: true,
      data: { cancelled: true },
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
