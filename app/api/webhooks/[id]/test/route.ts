import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { getWebhook } from "@/lib/webhooks";
import { sendTestWebhook } from "@/lib/webhook-delivery";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/webhooks/[id]/test
 * Send a test request to the webhook URL
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const webhook = await getWebhook(id, session.user.id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const result = await sendTestWebhook(webhook);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test webhook delivered successfully",
        httpStatus: result.httpStatus,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Test webhook delivery failed",
          httpStatus: result.httpStatus,
          error: result.errorMessage,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Failed to test webhook:", error);
    return NextResponse.json(
      { error: "Failed to test webhook" },
      { status: 500 }
    );
  }
}
