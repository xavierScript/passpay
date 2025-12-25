import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/constants";
import type { SubscriptionMetadata, ApiResponse } from "@/types";

/**
 * POST /api/subscription/create
 * Creates a new subscription for the given wallet and plan.
 * In a real app, this would record in a database and set up recurring payment delegation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, walletAddress } = body;

    if (!planId || !walletAddress) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Missing planId or walletAddress" },
        { status: 400 }
      );
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json<ApiResponse<null>>(
        { ok: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Create subscription metadata
    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    const subscription: SubscriptionMetadata = {
      walletAddress,
      tier: plan.id as "basic" | "pro" | "enterprise",
      startDate: now.toISOString(),
      nextBilling: nextBilling.toISOString(),
      status: "active",
      approvalId: `appr_${planId}_${walletAddress.slice(0, 6)}`,
    };

    // TODO: Store in database (for demo, return immediately)
    // TODO: Trigger smart wallet approval for recurring payment

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
