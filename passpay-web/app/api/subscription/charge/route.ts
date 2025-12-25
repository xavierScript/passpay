import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";
import { getEnv } from "@/lib/env";

/**
 * POST /api/subscription/charge
 * Cron job endpoint for monthly billing.
 * Secured with CRON_SECRET header.
 * Charges all active subscriptions via smart wallet delegation.
 */
export async function POST(req: NextRequest) {
  try {
    const env = getEnv();
    const secret = req.headers.get("x-cron-secret");
    if (secret !== env.CRON_SECRET) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Query all active subscriptions from database
    // TODO: For each subscription:
    //   - Check if nextBilling is due
    //   - Charge USDC via smart wallet delegation
    //   - Update nextBilling date
    //   - Handle failures (set status to 'grace')

    return NextResponse.json<ApiResponse<{ charged: number }>>({
      ok: true,
      data: { charged: 0 },
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
