import { NextRequest, NextResponse } from "next/server";
import type { SubscriptionMetadata, ApiResponse } from "@/types";

/**
 * GET /api/subscription/status?wallet=<address>
 * Retrieves subscription status for a given wallet.
 * TODO: Query database for subscription record.
 */
export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Missing wallet parameter" },
        { status: 400 }
      );
    }

    // Stub subscription data (replace with DB query)
    const subscription: SubscriptionMetadata = {
      walletAddress: wallet,
      tier: "pro",
      startDate: new Date().toISOString(),
      nextBilling: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: "active",
      approvalId: "appr_pro_demo",
    };

    return NextResponse.json<ApiResponse<SubscriptionMetadata>>({
      ok: true,
      data: subscription,
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
