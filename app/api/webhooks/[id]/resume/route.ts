import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-server";
import { resumeWebhook } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/webhooks/[id]/resume
 * Resume a paused webhook (start sending notifications again)
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const webhook = await resumeWebhook(id, session.user.id);

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        isActive: webhook.isActive,
        status: webhook.status,
        registries: webhook.registries,
        updatedAt: webhook.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to resume webhook:", error);
    return NextResponse.json(
      { error: "Failed to resume webhook" },
      { status: 500 }
    );
  }
}
