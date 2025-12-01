import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { getWebhook } from "@/lib/webhooks";
import { getDeliveryHistory } from "@/lib/webhook-delivery";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/webhooks/[id]/deliveries
 * Get delivery history for a webhook
 */
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  try {
    // Verify ownership
    const webhook = await getWebhook(id, session.user.id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const deliveries = await getDeliveryHistory(id, limit);

    return NextResponse.json({
      deliveries: deliveries.map((d) => ({
        id: d.id,
        eventType: d.eventType,
        status: d.status,
        httpStatus: d.httpStatus,
        errorMessage: d.errorMessage,
        attemptCount: d.attemptCount,
        maxAttempts: d.maxAttempts,
        deliveredAt: d.deliveredAt?.toISOString() || null,
        nextRetryAt: d.nextRetryAt?.toISOString() || null,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to get delivery history:", error);
    return NextResponse.json(
      { error: "Failed to get delivery history" },
      { status: 500 }
    );
  }
}
