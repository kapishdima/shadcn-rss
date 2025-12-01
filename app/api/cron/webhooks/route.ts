import { NextResponse } from "next/server";
import { processRetries } from "@/lib/webhook-delivery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/webhooks
 * Process pending webhook delivery retries
 * This should be called by a cron job periodically (e.g., every minute)
 */
export async function GET() {
  try {
    console.log("[Cron] Processing webhook retries...");
    const result = await processRetries();
    console.log("[Cron] Webhook retry processing complete:", result);

    return NextResponse.json({
      success: true,
      message: "Webhook retries processed",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Webhook retry processing failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
